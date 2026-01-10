import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Webhook event:", event.type);

    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription created:", subscription.id, "Customer:", subscription.customer);

        // Find company based on Stripe customer ID
        const { data: company, error: companyError } = await supabaseClient
          .from("companies")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (companyError || !company) {
          console.error("Could not find company for customer:", subscription.customer);
          break;
        }

        // Extract plan from subscription metadata
        const plan = subscription.metadata?.plan || "start";

        // Insert new subscription row
        const { error: insertError } = await supabaseClient
          .from("subscriptions")
          .insert({
            company_id: company.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            plan: plan,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });

        if (insertError) {
          console.error("Error inserting subscription:", insertError);
        } else {
          console.log("Subscription inserted for company:", company.id, "Plan:", plan);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment succeeded for invoice:", invoice.id);

        // Update usage_stats with the invoice ID
        const { error } = await supabaseClient
          .from("usage_stats")
          .update({ stripe_invoice_id: invoice.id })
          .eq("stripe_invoice_id", null)
          .is("stripe_invoice_id", null);

        if (error) {
          console.error("Error updating usage_stats:", error);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment failed for invoice:", invoice.id, "Customer:", invoice.customer);

        // Find subscription for this customer and mark payment as failed
        if (invoice.subscription) {
          const { error: updateError } = await supabaseClient
            .from("subscriptions")
            .update({ 
              status: "past_due",
              updated_at: new Date().toISOString()
            })
            .eq("stripe_subscription_id", invoice.subscription as string);

          if (updateError) {
            console.error("Error updating subscription to past_due:", updateError);
          } else {
            console.log("Subscription marked as past_due:", invoice.subscription);
          }
        }

        // TODO: Send email notification to user about failed payment
        // Could use Resend API here with RESEND_API_KEY secret
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id);

        // Check if there's a scheduled downgrade to apply
        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("scheduled_plan, scheduled_plan_date")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        // If there's a scheduled plan and the period has changed (new billing period started)
        if (existingSub?.scheduled_plan && existingSub?.scheduled_plan_date) {
          const scheduledDate = new Date(existingSub.scheduled_plan_date);
          const newPeriodStart = new Date(subscription.current_period_start * 1000);
          
          // If we've entered a new period that's at or after the scheduled date
          if (newPeriodStart >= scheduledDate) {
            console.log("Applying scheduled downgrade:", existingSub.scheduled_plan);
            
            // Plan pricing configuration
            const PLAN_PRICES: Record<string, { monthly: string; metered: string }> = {
              start: {
                monthly: 'price_1So6e7RrATtOsqxEBhJWCmr1',
                metered: 'price_1So6irRrATtOsqxE37JO8Jzh'
              },
              pro: {
                monthly: 'price_1So6gdRrATtOsqxE1IpvCDQD',
                metered: 'price_1So6jxRrATtOsqxEBuNnwcpa'
              },
              elit: {
                monthly: 'price_1So6hGRrATtOsqxE4w8y3VPE',
                metered: 'price_1So6lARrATtOsqxEHvYXCjbt'
              }
            };

            const newPrices = PLAN_PRICES[existingSub.scheduled_plan];
            if (newPrices) {
              // Get current subscription items
              const monthlyItem = subscription.items.data.find((item: any) => 
                item.price.recurring?.usage_type !== 'metered'
              );
              const meteredItem = subscription.items.data.find((item: any) => 
                item.price.recurring?.usage_type === 'metered'
              );

              if (monthlyItem && meteredItem) {
                // Apply the plan change now
                await stripe.subscriptions.update(subscription.id, {
                  items: [
                    { id: monthlyItem.id, deleted: true },
                    { id: meteredItem.id, deleted: true },
                    { price: newPrices.monthly },
                    { price: newPrices.metered },
                  ],
                  proration_behavior: 'none', // No proration for scheduled downgrades
                });

                // Update database with new plan and clear scheduled change
                await supabaseClient
                  .from("subscriptions")
                  .update({
                    plan: existingSub.scheduled_plan,
                    scheduled_plan: null,
                    scheduled_plan_date: null,
                    status: subscription.status,
                    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  })
                  .eq("stripe_subscription_id", subscription.id);

                console.log("Scheduled downgrade applied:", existingSub.scheduled_plan);
                break;
              }
            }
          }
        }

        // Normal update - just sync status and period dates
        const { error } = await supabaseClient
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscription.id);

        // Update subscription status
        const { error } = await supabaseClient
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
