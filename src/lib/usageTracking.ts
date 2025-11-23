import { supabase } from "@/integrations/supabase/client";

export const PRICES = {
  MONTHLY_FEE: 239,
  EDITED_IMAGE: 4.95,
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
      console.log(`[USAGE] User in trial, decrementing trial images`);
      
      // Update trial image counters
      const { error: trialError } = await supabase
        .from("companies")
        .update({
          trial_images_used: (company.trial_images_used || 0) + 1,
          trial_images_remaining: Math.max(0, (company.trial_images_remaining || 0) - 1),
        })
        .eq("id", company.id);

      if (trialError) {
        console.error("Error updating trial image counters:", trialError);
      }

      // Do NOT report to Stripe or track usage stats during trial
      console.log(`[USAGE] Trial image used. Remaining: ${(company.trial_images_remaining || 0) - 1}`);
      return;
    }

    // Not in trial - proceed with normal billing
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

    // Track each edited image
    const newCount = (existingStats?.edited_images_count || 0) + 1;
    const newCost = (existingStats?.edited_images_cost || 0) + PRICES.EDITED_IMAGE;

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
