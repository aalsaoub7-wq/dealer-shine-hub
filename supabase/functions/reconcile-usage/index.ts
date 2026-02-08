import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RECONCILE] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    log("Function invoked");

    // Auth check - allow both user calls and internal (webhook) calls
    const authHeader = req.headers.get("Authorization");
    let callerUserId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      callerUserId = userData?.user?.id ?? null;
    }

    // Parse body
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // No body is fine
    }

    const targetCompanyId = body.company_id as string | undefined;
    const dryRun = body.dry_run === true;
    const backfillMode = body.backfill === true;
    const isInternalCall = body._internal === true;

    log("Parameters", { targetCompanyId, dryRun, backfillMode, callerUserId, isInternalCall });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    // Admin test company - skip
    const ADMIN_TEST_COMPANY_ID = "e0496e49-c30b-4fbd-a346-d8dfeacdf1ea";

    // Get companies to reconcile
    let companiesQuery = supabase
      .from("companies")
      .select("id, stripe_customer_id, name")
      .not("stripe_customer_id", "is", null);

    if (targetCompanyId) {
      companiesQuery = companiesQuery.eq("id", targetCompanyId);
    }

    const { data: companies, error: companiesError } = await companiesQuery;

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`);
    }

    if (!companies || companies.length === 0) {
      log("No companies to reconcile");
      return new Response(
        JSON.stringify({ message: "No companies to reconcile", reconciled: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const results: Array<{
      company_id: string;
      company_name: string;
      unreported_count: number;
      reported_count: number;
      backfilled_count: number;
      errors: string[];
    }> = [];

    for (const company of companies) {
      if (company.id === ADMIN_TEST_COMPANY_ID) {
        log("Skipping admin test company");
        continue;
      }

      const companyResult = {
        company_id: company.id,
        company_name: company.name,
        unreported_count: 0,
        reported_count: 0,
        backfilled_count: 0,
        errors: [] as string[],
      };

      try {
        log(`Processing company: ${company.name} (${company.id})`);

        // Get active subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: company.stripe_customer_id!,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length === 0) {
          log("No active subscription, skipping");
          results.push(companyResult);
          continue;
        }

        const subscription = subscriptions.data[0];

        // Find metered item
        const meteredItem = subscription.items.data.find(
          (item: any) => item.price.recurring?.usage_type === "metered"
        );

        if (!meteredItem) {
          log("No metered price in subscription, skipping");
          results.push(companyResult);
          continue;
        }

        const meterId = (meteredItem.price.recurring as any)?.meter;
        if (!meterId) {
          log("No meter ID found, skipping");
          results.push(companyResult);
          continue;
        }

        // Get meter event name
        const meter = await stripe.billing.meters.retrieve(meterId);
        const eventName = meter.event_name;

        log(`Meter: ${meterId}, event: ${eventName}`);

        // Check included images
        const includedImages = parseInt(subscription.metadata?.included_images || "0");

        // === NORMAL RECONCILIATION: Process unreported billing_events ===
        const { data: unreportedEvents, error: eventsError } = await supabase
          .from("billing_events")
          .select("id, created_at")
          .eq("company_id", company.id)
          .eq("stripe_reported", false)
          .order("created_at", { ascending: true });

        if (eventsError) {
          companyResult.errors.push(`Failed to fetch unreported events: ${eventsError.message}`);
          results.push(companyResult);
          continue;
        }

        companyResult.unreported_count = unreportedEvents?.length || 0;
        log(`Unreported events: ${companyResult.unreported_count}`);

        if (unreportedEvents && unreportedEvents.length > 0 && !dryRun) {
          // If there are included images, check current usage to decide what to bill
          let eventsToReport = unreportedEvents;

          if (includedImages > 0) {
            // Get total billing events for this billing period (reported + unreported)
            const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
            const { data: periodEvents } = await supabase
              .from("billing_events")
              .select("id")
              .eq("company_id", company.id)
              .eq("stripe_reported", true)
              .gte("created_at", periodStart);

            const alreadyReported = periodEvents?.length || 0;
            const totalWithUnreported = alreadyReported + unreportedEvents.length;

            if (totalWithUnreported <= includedImages) {
              // All events within included limit - mark as reported but don't send to Stripe
              log(`All ${totalWithUnreported} events within included limit of ${includedImages}, marking without Stripe`);
              const ids = unreportedEvents.map((e) => e.id);
              await supabase
                .from("billing_events")
                .update({ stripe_reported: true, stripe_reported_at: new Date().toISOString() })
                .in("id", ids);
              companyResult.reported_count = unreportedEvents.length;
              results.push(companyResult);
              continue;
            } else if (alreadyReported < includedImages) {
              // Some are included, some need billing
              const freeRemaining = includedImages - alreadyReported;
              const freeEvents = unreportedEvents.slice(0, freeRemaining);
              eventsToReport = unreportedEvents.slice(freeRemaining);

              // Mark free events as reported without Stripe
              if (freeEvents.length > 0) {
                const freeIds = freeEvents.map((e) => e.id);
                await supabase
                  .from("billing_events")
                  .update({ stripe_reported: true, stripe_reported_at: new Date().toISOString() })
                  .in("id", freeIds);
                log(`Marked ${freeEvents.length} events as included (free)`);
              }
            }
          }

          // Report billable events to Stripe one by one WITH idempotency identifier
          for (const event of eventsToReport) {
            try {
              const meterEvent = await stripe.billing.meterEvents.create({
                event_name: eventName,
                payload: {
                  value: "1",
                  stripe_customer_id: company.stripe_customer_id!,
                },
                timestamp: Math.floor(new Date(event.created_at).getTime() / 1000),
                // Use billing_event.id as idempotency key
                // Stripe deduplicates within 24h rolling window
                identifier: event.id,
              });

              // Mark as reported (server-side with service role)
              await supabase
                .from("billing_events")
                .update({
                  stripe_reported: true,
                  stripe_reported_at: new Date().toISOString(),
                  stripe_event_id: meterEvent.identifier,
                })
                .eq("id", event.id);

              companyResult.reported_count++;
              log(`Reported event ${event.id} -> ${meterEvent.identifier}`);
            } catch (meterError: any) {
              const errMsg = `Failed to report event ${event.id}: ${meterError.message}`;
              log(errMsg);
              companyResult.errors.push(errMsg);
            }

            // Small delay to avoid rate limiting
            await new Promise((r) => setTimeout(r, 200));
          }
        }

        // === BACKFILL MODE: Compare usage_stats vs Stripe meter summaries ===
        if (backfillMode) {
          log("Running backfill mode");

          const periodStart = subscription.current_period_start;
          const periodEnd = subscription.current_period_end;

          // Get all users in the company
          const { data: companyUsers } = await supabase
            .from("user_companies")
            .select("user_id")
            .eq("company_id", company.id);

          const userIds = (companyUsers || []).map((u) => u.user_id);

          if (userIds.length === 0) {
            log("No users in company, skipping backfill");
            results.push(companyResult);
            continue;
          }

          // Get usage_stats total for the billing period
          const periodStartDate = new Date(periodStart * 1000);
          const periodEndDate = new Date(periodEnd * 1000);

          // Generate month strings that fall within the billing period
          const months: string[] = [];
          const current = new Date(periodStartDate.getFullYear(), periodStartDate.getMonth(), 1);
          while (current <= periodEndDate) {
            months.push(
              `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-01`
            );
            current.setMonth(current.getMonth() + 1);
          }

          log(`Backfill months: ${months.join(", ")}`);

          const { data: usageStats } = await supabase
            .from("usage_stats")
            .select("edited_images_count")
            .in("user_id", userIds)
            .in("month", months);

          const dbTotal = (usageStats || []).reduce(
            (sum, s) => sum + (s.edited_images_count || 0),
            0
          );

          // === FIX: Use listEventSummaries as PRIMARY method ===
          // The Preview Invoice API does NOT include pending metered usage
          // from Billing Meters, which caused the 80-event overbilling disaster.
          // listEventSummaries directly queries the meter for actual event counts.
          let stripeTotal = 0;
          try {
            const alignedStart = Math.floor(periodStart / 60) * 60;
            const alignedEnd = Math.ceil(periodEnd / 60) * 60;
            const summaries = await stripe.billing.meters.listEventSummaries(meterId, {
              customer: company.stripe_customer_id!,
              start_time: alignedStart,
              end_time: alignedEnd,
            });
            stripeTotal = summaries.data.reduce(
              (sum: number, s: any) => sum + s.aggregated_value,
              0
            );
            log(`Meter event summaries total: ${stripeTotal}`);
          } catch (summaryErr: any) {
            log(`Meter summaries failed: ${summaryErr.message}`);
            companyResult.errors.push(`Could not determine Stripe usage: ${summaryErr.message}`);
            results.push(companyResult);
            continue;
          }

          const gap = dbTotal - stripeTotal;
          log(`Backfill: DB total=${dbTotal}, Stripe total=${stripeTotal}, gap=${gap}`);

          if (gap > 0 && !dryRun) {
            log(`Backfilling ${gap} missing meter events`);

            for (let i = 0; i < gap; i++) {
              try {
                // Use a deterministic identifier for backfill events too
                const backfillIdentifier = `backfill_${company.id}_${months[0]}_${i}`;
                await stripe.billing.meterEvents.create({
                  event_name: eventName,
                  payload: {
                    value: "1",
                    stripe_customer_id: company.stripe_customer_id!,
                  },
                  timestamp: Math.floor(Date.now() / 1000),
                  identifier: backfillIdentifier,
                });
                companyResult.backfilled_count++;
              } catch (err: any) {
                companyResult.errors.push(`Backfill event ${i + 1} failed: ${err.message}`);
              }

              // Delay to avoid rate limiting
              await new Promise((r) => setTimeout(r, 300));
            }

            log(`Backfilled ${companyResult.backfilled_count}/${gap} events`);
          } else if (gap > 0 && dryRun) {
            log(`DRY RUN: Would backfill ${gap} events`);
            companyResult.backfilled_count = gap; // Show what would be backfilled
          }
        }
      } catch (companyError: any) {
        companyResult.errors.push(`Company processing failed: ${companyError.message}`);
        log(`Error processing company ${company.name}: ${companyError.message}`);
      }

      results.push(companyResult);
    }

    const totalReconciled = results.reduce((sum, r) => sum + r.reported_count, 0);
    const totalBackfilled = results.reduce((sum, r) => sum + r.backfilled_count, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    log("Reconciliation complete", { totalReconciled, totalBackfilled, totalErrors });

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: dryRun,
        total_reconciled: totalReconciled,
        total_backfilled: totalBackfilled,
        total_errors: totalErrors,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    log("FATAL ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
