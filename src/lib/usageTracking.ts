import { supabase } from "@/integrations/supabase/client";

export const PRICES = {
  EDITED_IMAGE: 4.95,
};

export const trackUsage = async (
  type: "edited_image",
  carId?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

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

    // Report usage to Stripe for metered billing
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
