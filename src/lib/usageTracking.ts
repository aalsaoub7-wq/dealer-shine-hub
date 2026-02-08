import { supabase } from "@/integrations/supabase/client";

// Joels Bil company ID - undantag från gratis regenerering
const JOELS_BIL_COMPANY_ID = '4ef5e6f6-28c8-4291-8c08-9b5d46466598';

// Admin test account - special pricing override
const ADMIN_TEST_COMPANY_ID = 'e0496e49-c30b-4fbd-a346-d8dfeacdf1ea';
const ADMIN_TEST_PRICE_PER_IMAGE = 3.2;

// Cache for billing info to avoid multiple calls in the same session
let billingInfoCache: { pricePerImage: number; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Fetches the price per image dynamically from Stripe via edge function
 */
const getDynamicPricePerImage = async (): Promise<number> => {
  // Check cache first
  if (billingInfoCache && Date.now() - billingInfoCache.timestamp < CACHE_TTL_MS) {
    console.log('[USAGE] Using cached price per image:', billingInfoCache.pricePerImage);
    return billingInfoCache.pricePerImage;
  }

  try {
    const { data, error } = await supabase.functions.invoke("get-billing-info");
    
    if (error) {
      console.error('[USAGE] Error fetching billing info:', error);
      return 0; // Fallback to 0 if we can't get price
    }

    const pricePerImage = data?.planConfig?.pricePerImage || 0;
    
    // Cache the result
    billingInfoCache = { pricePerImage, timestamp: Date.now() };
    
    console.log('[USAGE] Fetched dynamic price per image:', pricePerImage);
    return pricePerImage;
  } catch (err) {
    console.error('[USAGE] Failed to fetch billing info:', err);
    return 0;
  }
};

/**
 * Inserts a durable billing event into the database.
 * This is the source of truth for billing - even if Stripe reporting fails,
 * the reconciliation function will pick it up later.
 */
const insertBillingEvent = async (
  companyId: string,
  userId: string,
  carId?: string,
  photoId?: string
): Promise<string | null> => {
  try {
    const insertData: Record<string, unknown> = {
      company_id: companyId,
      user_id: userId,
      event_type: 'edited_image',
    };
    if (carId) insertData.car_id = carId;
    if (photoId) insertData.photo_id = photoId;

    const { data, error } = await supabase
      .from("billing_events")
      .insert(insertData as any)
      .select("id")
      .single();

    if (error) {
      console.error('[USAGE] Failed to insert billing event:', error);
      return null;
    }

    console.log('[USAGE] Billing event recorded:', data.id);
    return data.id;
  } catch (err) {
    console.error('[USAGE] Error inserting billing event:', err);
    return null;
  }
};

/**
 * Reports usage to Stripe with retry logic (optimistic, best-effort).
 * If this fails, the reconciliation function will catch it.
 * 
 * IMPORTANT: The billing_event_id is passed as the Stripe meter event identifier
 * for idempotency. Both this optimistic call and the reconciliation function
 * use the same identifier, so Stripe deduplicates automatically within 24h.
 * 
 * The server-side edge function handles marking the billing event as reported
 * after successfully creating the meter event (no client-side DB update needed).
 */
const reportToStripeOptimistic = async (billingEventId: string | null, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error: reportError } = await supabase.functions.invoke(
        "report-usage-to-stripe",
        { body: { quantity: 1, billing_event_id: billingEventId } }
      );
      if (reportError) {
        throw reportError;
      }
      console.log(`[USAGE] Stripe reporting succeeded on attempt ${attempt}`, data);
      return;
    } catch (err) {
      console.error(`[USAGE] Stripe reporting attempt ${attempt}/${maxRetries} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  console.warn("[USAGE] All Stripe reporting attempts failed - reconciliation will handle this event");
};

export const trackUsage = async (
  type: "edited_image",
  carId?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's company to check trial status
    const { data: userCompany } = await supabase
      .from("user_companies")
      .select("company_id, companies(id, trial_end_date, trial_images_remaining, trial_images_used, stripe_customer_id)")
      .eq("user_id", user.id)
      .single();

    if (!userCompany?.companies) {
      console.error("No company found for user");
      return;
    }

    const company = Array.isArray(userCompany.companies)
      ? userCompany.companies[0]
      : userCompany.companies;

    // Check if user is in trial
    const now = new Date();
    const trialEndDate = company.trial_end_date ? new Date(company.trial_end_date) : null;
    const isInTrial = trialEndDate ? now < trialEndDate : false;

    // If in trial, decrement trial images
    if (isInTrial) {
      console.log(`[USAGE] User in trial, decrementing trial images via edge function`);
      
      // Use edge function with service role to update trial counters (bypasses RLS)
      const { data, error: trialError } = await supabase.functions.invoke(
        "track-trial-usage",
        { body: { companyId: company.id } }
      );

      if (trialError) {
        console.error("Error updating trial image counters:", trialError);
      } else {
        console.log(`[USAGE] Trial image used. Remaining: ${data?.trial_images_remaining}`);
      }

      // Do NOT report to Stripe or track usage stats during trial
      return;
    }

    // === STEP 1: Insert durable billing event (source of truth) ===
    const billingEventId = await insertBillingEvent(company.id, user.id, carId);

    // === STEP 2: Update usage_stats for dashboard display ===
    const monthDate = now.getMonth(); // 0-11
    const year = now.getFullYear();
    const month = `${year}-${String(monthDate + 1).padStart(2, '0')}-01`;

    // Get or create usage stats for current month
    const { data: existingStats, error: fetchError } = await supabase
      .from("usage_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", month)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching usage stats:", fetchError);
      return;
    }

    // Get price per image dynamically from Stripe
    let pricePerImage: number;
    
    if (company.id === ADMIN_TEST_COMPANY_ID) {
      // Admin test account uses fixed test pricing
      pricePerImage = ADMIN_TEST_PRICE_PER_IMAGE;
      console.log('[USAGE] Using admin test pricing: 3.2 kr/image');
    } else {
      // All other accounts get dynamic pricing from Stripe
      pricePerImage = await getDynamicPricePerImage();
      console.log(`[USAGE] Using dynamic Stripe pricing: ${pricePerImage} kr/image`);
    }

    const newCount = (existingStats?.edited_images_count || 0) + 1;
    const newCost = (existingStats?.edited_images_cost || 0) + pricePerImage;

    const updates = {
      user_id: user.id,
      month,
      edited_images_count: newCount,
      edited_images_cost: newCost,
      total_cost: newCost,
    };

    if (existingStats) {
      const { error } = await supabase
        .from("usage_stats")
        .update(updates)
        .eq("id", existingStats.id);

      if (error) console.error("Error updating usage stats:", error);
    } else {
      const { error } = await supabase
        .from("usage_stats")
        .insert(updates);

      if (error) console.error("Error inserting usage stats:", error);
    }

    // === STEP 3: Optimistic Stripe report (best-effort, reconciliation is safety net) ===
    // Fire and forget - don't await so we don't block the UI
    reportToStripeOptimistic(billingEventId).catch(err => {
      console.warn('[USAGE] Optimistic Stripe report failed (will be reconciled):', err);
    });
  } catch (error) {
    console.error("Error tracking usage:", error);
  }
};

/**
 * Smart billing for regenerations - allows one free regeneration per image
 * Exception: Joels Bil (company_id: 4ef5e6f6-28c8-4291-8c08-9b5d46466598) pays for all regenerations
 */
export const trackRegenerationUsage = async (
  photoId: string,
  carId: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user belongs to Joels Bil - they do NOT get free regeneration
    const { data: userCompany } = await supabase
      .from("user_companies")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (userCompany?.company_id === JOELS_BIL_COMPANY_ID) {
      console.log("[USAGE] Joels Bil - charging for regeneration");
      await trackUsage("edited_image", carId);
      return;
    }

    // Check if photo has free regeneration available
    const { data: photo } = await supabase
      .from("photos")
      .select("has_free_regeneration")
      .eq("id", photoId)
      .single();

    if (photo?.has_free_regeneration) {
      // First regeneration - FREE! Set flag to false
      console.log("[USAGE] Free regeneration used for photo:", photoId);
      await supabase
        .from("photos")
        .update({ has_free_regeneration: false })
        .eq("id", photoId);
      return; // Skip billing
    }

    // No free regeneration left - charge
    console.log("[USAGE] Charging for regeneration, no free regeneration left");
    await trackUsage("edited_image", carId);
  } catch (error) {
    console.error("Error in trackRegenerationUsage:", error);
    // On error - still charge for safety
    await trackUsage("edited_image", carId);
  }
};

/**
 * Triggers server-side reconciliation for a specific company.
 * Called automatically on dashboard load (scoped to user's company).
 */
export const triggerReconciliation = async (companyId?: string, backfill = false): Promise<any> => {
  try {
    const body: Record<string, unknown> = {};
    if (companyId) body.company_id = companyId;
    if (backfill) body.backfill = true;

    const { data, error } = await supabase.functions.invoke("reconcile-usage", {
      body,
    });

    if (error) {
      console.error("[RECONCILE] Error triggering reconciliation:", error);
      return null;
    }

    console.log("[RECONCILE] Reconciliation result:", data);
    return data;
  } catch (err) {
    console.error("[RECONCILE] Failed to trigger reconciliation:", err);
    return null;
  }
};
