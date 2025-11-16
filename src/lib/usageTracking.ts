import { supabase } from "@/integrations/supabase/client";

const PRICES = {
  ADD_CAR: 19,
  EDIT_IMAGE: 9,
  GENERATE_DESCRIPTION: 5,
};

export const trackUsage = async (
  type: "add_car" | "edit_image" | "generate_description"
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

    const updates: any = {
      user_id: user.id,
      month,
    };

    if (type === "add_car") {
      updates.added_cars_count = (existingStats?.added_cars_count || 0) + 1;
      updates.added_cars_cost = (existingStats?.added_cars_cost || 0) + PRICES.ADD_CAR;
    } else if (type === "edit_image") {
      updates.edited_images_count = (existingStats?.edited_images_count || 0) + 1;
      updates.edited_images_cost = (existingStats?.edited_images_cost || 0) + PRICES.EDIT_IMAGE;
    } else if (type === "generate_description") {
      updates.generated_descriptions_count = (existingStats?.generated_descriptions_count || 0) + 1;
      updates.generated_descriptions_cost = (existingStats?.generated_descriptions_cost || 0) + PRICES.GENERATE_DESCRIPTION;
    }

    // Calculate total cost
    updates.total_cost = 
      (type === "add_car" ? updates.added_cars_cost : existingStats?.added_cars_cost || 0) +
      (type === "edit_image" ? updates.edited_images_cost : existingStats?.edited_images_cost || 0) +
      (type === "generate_description" ? updates.generated_descriptions_cost : existingStats?.generated_descriptions_cost || 0);

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
  } catch (error) {
    console.error("Error tracking usage:", error);
  }
};

export { PRICES };
