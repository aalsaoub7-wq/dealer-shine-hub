import { supabase } from "@/integrations/supabase/client";

export type PlanType = 'start' | 'pro' | 'elit';

// Joels Bil company ID - undantag från gratis regenerering
const JOELS_BIL_COMPANY_ID = '4ef5e6f6-28c8-4291-8c08-9b5d46466598';

// Admin test account - special pricing override
const ADMIN_TEST_COMPANY_ID = 'e0496e49-c30b-4fbd-a346-d8dfeacdf1ea';
const ADMIN_TEST_PRICE_PER_IMAGE = 3.2;

export const PLANS = {
  start: {
    id: 'start',
    name: 'Start',
    monthlyFee: 349,
    pricePerImage: 5.95,
    color: 'green',
    colorClass: 'text-green-500',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/50',
    isPopular: false,
    stripePrices: {
      monthly: 'price_1So6e7RrATtOsqxEBhJWCmr1',
      metered: 'price_1So6irRrATtOsqxE37JO8Jzh'
    },
    recommended: '< 100 bilder/månad',
    breakEvenImages: 100,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyFee: 449,
    pricePerImage: 2.95,
    color: 'blue',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/50',
    isPopular: true,
    stripePrices: {
      monthly: 'price_1So6gdRrATtOsqxE1IpvCDQD',
      metered: 'price_1So6jxRrATtOsqxEBuNnwcpa'
    },
    recommended: '100-500 bilder/månad',
    breakEvenImages: 500,
  },
  elit: {
    id: 'elit',
    name: 'Elit',
    monthlyFee: 995,
    pricePerImage: 1.95,
    color: 'purple',
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/50',
    isPopular: false,
    stripePrices: {
      monthly: 'price_1So6hGRrATtOsqxE4w8y3VPE',
      metered: 'price_1So6lARrATtOsqxEHvYXCjbt'
    },
    recommended: '500+ bilder/månad',
    breakEvenImages: Infinity,
  }
} as const;

// Legacy export for backward compatibility
export const PRICES = {
  MONTHLY_FEE: 349,
  EDITED_IMAGE: 5.95,
};

export const getPlanPricing = (plan: PlanType) => {
  return PLANS[plan] || PLANS.start;
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

    // Not in trial - proceed with normal billing
    const monthDate = now.getMonth(); // 0-11
    const year = now.getFullYear();
    const month = `${year}-${String(monthDate + 1).padStart(2, '0')}-01`;

    // Get subscription to determine plan and pricing
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("company_id", company.id)
      .eq("status", "active")
      .maybeSingle();

    const plan = (subscription?.plan as PlanType) || 'start';
    const planPricing = getPlanPricing(plan);

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

    // Track each edited image with plan-specific pricing
    // Admin test account uses custom pricing override
    const pricePerImage = company.id === ADMIN_TEST_COMPANY_ID 
      ? ADMIN_TEST_PRICE_PER_IMAGE 
      : planPricing.pricePerImage;
    
    if (company.id === ADMIN_TEST_COMPANY_ID) {
      console.log('[USAGE] Using admin test pricing: 3.2 kr/image');
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

    // Report usage to Stripe for metered billing (only for paid users)
    try {
      const { error: reportError } = await supabase.functions.invoke(
        "report-usage-to-stripe",
        {
          body: { quantity: 1 },
        }
      );

      if (reportError) {
        console.error("Error reporting usage to Stripe:", reportError);
      }
    } catch (stripeError) {
      console.error("Failed to report usage to Stripe:", stripeError);
      // Don't fail the whole operation if Stripe reporting fails
    }
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
