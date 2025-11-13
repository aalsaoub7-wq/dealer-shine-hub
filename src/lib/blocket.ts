// Frontend helper-funktioner för Blocket-integration
// Används för att trigga sync och hämta status från UI

import { supabase } from "@/integrations/supabase/client";

/**
 * Synka en bil till Blocket
 * Anropar edge-funktionen som sköter själva API-kommunikationen
 */
export async function syncCarToBlocket(carId: string): Promise<{
  ok: boolean;
  message?: string;
  status?: any;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("blocket-sync", {
      body: { carId },
    });

    if (error) {
      console.error("[Blocket] Sync error:", error);
      return {
        ok: false,
        error: error.message || "Failed to sync to Blocket",
      };
    }

    return data;
  } catch (error: any) {
    console.error("[Blocket] Sync exception:", error);
    return {
      ok: false,
      error: error.message || "Unexpected error during sync",
    };
  }
}

/**
 * Hämta Blocket-synkstatus för en bil
 */
export async function getBlocketStatus(carId: string) {
  const { data, error } = await supabase
    .from("blocket_ad_sync")
    .select("*")
    .eq("car_id", carId)
    .maybeSingle();

  if (error) {
    console.error("[Blocket] Error fetching status:", error);
    return null;
  }

  return data;
}

/**
 * Lyssna på förändringar i Blocket-synkstatus (realtime)
 */
export function subscribeToBlocketStatus(
  carId: string,
  callback: (status: any) => void
) {
  const channel = supabase
    .channel(`blocket-sync-${carId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "blocket_ad_sync",
        filter: `car_id=eq.${carId}`,
      },
      (payload) => {
        console.log("[Blocket] Status changed:", payload);
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Formatera Blocket-status för visning i UI
 */
export function formatBlocketStatus(status: any | null): string {
  if (!status) return "Inte synkad";

  if (status.state === "deleted") return "Borttagen från Blocket";
  
  if (status.last_action_state === "error") {
    return `Fel: ${status.last_error || "Okänt fel"}`;
  }
  
  if (status.last_action_state === "processing") {
    return `Bearbetar: ${status.last_action || "okänd åtgärd"}`;
  }
  
  if (status.state === "created") {
    return status.blocket_ad_id 
      ? `Publicerad (ID: ${status.blocket_ad_id})`
      : "Publicerad på Blocket";
  }

  return "Okänd status";
}

/**
 * Kontrollera om en bil kan synkas till Blocket
 * Returnerar felmeddelande om något saknas
 */
export function validateCarForBlocket(car: any): string | null {
  if (!car.make) return "Bilmärke saknas";
  if (!car.model) return "Modell saknas";
  if (!car.year) return "Årsmodell saknas";
  if (!car.price) return "Pris saknas";
  
  // Rekommenderade fält
  if (!car.description && !car.notes) {
    console.warn("[Blocket] Varning: Beskrivning saknas");
  }
  if (!car.image_urls || car.image_urls.length === 0) {
    console.warn("[Blocket] Varning: Inga bilder uppladdade");
  }

  return null;
}
