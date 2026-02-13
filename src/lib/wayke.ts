// Frontend helper functions for Wayke integration
// Mirrors src/lib/blocket.ts pattern

import { supabase } from "@/integrations/supabase/client";

export async function syncCarToWayke(carId: string, imageUrls?: string[], companyId?: string): Promise<{
  ok: boolean;
  message?: string;
  status?: any;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("wayke-sync", {
      body: { carId, imageUrls, companyId },
    });

    if (error) {
      console.error("[Wayke] Sync error:", error);
      return { ok: false, error: error.message || "Failed to sync to Wayke" };
    }

    return data;
  } catch (error: any) {
    console.error("[Wayke] Sync exception:", error);
    return { ok: false, error: error.message || "Unexpected error during sync" };
  }
}

export async function getWaykeStatus(carId: string) {
  const { data, error } = await supabase
    .from("wayke_ad_sync" as any)
    .select("*")
    .eq("car_id", carId)
    .maybeSingle();

  if (error) {
    console.error("[Wayke] Error fetching status:", error);
    return null;
  }

  return data;
}

export function subscribeToWaykeStatus(
  carId: string,
  callback: (status: any) => void
) {
  const channel = supabase
    .channel(`wayke-sync-${carId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "wayke_ad_sync",
        filter: `car_id=eq.${carId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function formatWaykeStatus(status: any | null): string {
  if (!status) return "Inte synkad";

  if (status.state === "deleted") return "Borttagen från Wayke";

  if (status.last_action_state === "error") {
    return `Fel: ${status.last_error || "Okänt fel"}`;
  }

  if (status.last_action_state === "processing") {
    return `Bearbetar: ${status.last_action || "okänd åtgärd"}`;
  }

  if (status.state === "created") {
    return status.wayke_vehicle_id
      ? `Publicerad (ID: ${status.wayke_vehicle_id})`
      : "Publicerad på Wayke";
  }

  return "Okänd status";
}

export function validateCarForWayke(car: any): string | null {
  if (!car.make) return "Bilmärke saknas";
  if (!car.model) return "Modell saknas";
  if (!car.year) return "Årsmodell saknas";
  if (!car.price) return "Pris saknas";
  return null;
}
