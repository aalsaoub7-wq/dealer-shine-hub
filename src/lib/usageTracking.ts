import { supabase } from "@/integrations/supabase/client";

export type PlanType = 'start' | 'pro' | 'elit';

export const PLANS = {
  start: {
    id: 'start',
    name: 'Start',
    monthlyFee: 239,
    pricePerImage: 4.95,
    color: 'green',
    colorClass: 'text-green-500',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/50',
    isPopular: false,
    stripePrices: {
      monthly: 'price_1SaG7tRrATtOsqxE8nAWiFuY',
      metered: 'price_1SaGraRrATtOsqxE9qIFXSax'
    },
    recommended: '< 100 bilder/månad',
    breakEvenImages: 100,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyFee: 449,
    pricePerImage: 1.95,
    color: 'blue',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/50',
    isPopular: true,
    stripePrices: {
      monthly: 'price_1SaG85RrATtOsqxEFU109fpS',
      metered: 'price_1SaGsbRrATtOsqxEj14M7j1A'
    },
    recommended: '100-500 bilder/månad',
    breakEvenImages: 500,
  },
  elit: {
    id: 'elit',
    name: 'Elit',
    monthlyFee: 995,
    pricePerImage: 0.99,
    color: 'purple',
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/50',
    isPopular: false,
    stripePrices: {
      monthly: 'price_1SaG86RrATtOsqxEYMD9EfdF',
      metered: 'price_1SaGsvRrATtOsqxEtH1fjQmG'
    },
    recommended: '500+ bilder/månad',
    breakEvenImages: Infinity,
  }
} as const;

// Legacy export for backward compatibility
export const PRICES = {
  MONTHLY_FEE: 239,
  EDITED_IMAGE: 4.95,
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
    const newCount = (existingStats?.edited_images_count || 0) + 1;
    const newCost = (existingStats?.edited_images_cost || 0) + planPricing.pricePerImage;

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
