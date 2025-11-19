import { supabase } from "@/integrations/supabase/client";

const PRICES = {
  CAR_WITH_EDITED_IMAGES: 99,
  GENERATE_DESCRIPTION: 5,
};

export const trackUsage = async (
  type: "car_with_edited_images" | "generate_description",
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

    const updates: any = {
      user_id: user.id,
      month,
    };

    if (type === "car_with_edited_images") {
      // Check if this car was already counted this month
      const { data: existingCars } = await supabase
        .from("photos")
        .select("car_id")
        .eq("car_id", carId)
        .eq("is_edited", true);

      // Only charge if this is the first edited image for this car this month
      const isFirstEditForCar = !existingCars || existingCars.length === 0;
      
      if (isFirstEditForCar) {
        updates.cars_with_edited_images_count = (existingStats?.cars_with_edited_images_count || 0) + 1;
        updates.cars_with_edited_images_cost = (existingStats?.cars_with_edited_images_cost || 0) + PRICES.CAR_WITH_EDITED_IMAGES;
      }
    } else if (type === "generate_description") {
      updates.generated_descriptions_count = (existingStats?.generated_descriptions_count || 0) + 1;
      updates.generated_descriptions_cost = (existingStats?.generated_descriptions_cost || 0) + PRICES.GENERATE_DESCRIPTION;
    }

    // Calculate total cost
    updates.total_cost = 
      (existingStats?.cars_with_edited_images_cost || 0) +
      (type === "car_with_edited_images" && updates.cars_with_edited_images_cost ? updates.cars_with_edited_images_cost : 0) +
      (existingStats?.generated_descriptions_cost || 0) +
      (type === "generate_description" && updates.generated_descriptions_cost ? updates.generated_descriptions_cost : 0);

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
