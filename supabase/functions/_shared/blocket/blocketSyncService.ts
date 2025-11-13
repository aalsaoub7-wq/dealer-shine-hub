// blocketSyncService.ts
// Huvudlogiken som håller Blocket-annonser synkade med din plattform.
// Implementerar DB-access via Supabase client och hanterar hela sync-flödet.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BlocketClient } from "./blocketClient.ts";
import type { Car, BlocketAdSync } from "./blocketTypes.ts";

// Supabase client för DB-access
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

// ====== DB-FUNKTIONER (implementerade mot Supabase) ======

async function getCarById(carId: string): Promise<Car> {
  console.log("[BlocketSync] Fetching car:", carId);
  
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", carId)
    .single();

  if (error) {
    console.error("[BlocketSync] Error fetching car:", error);
    throw new Error(`Failed to fetch car: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Car not found: ${carId}`);
  }

  return data as Car;
}

async function getBlocketSyncByCarId(carId: string): Promise<BlocketAdSync | null> {
  console.log("[BlocketSync] Fetching sync record for car:", carId);
  
  const { data, error } = await supabase
    .from("blocket_ad_sync")
    .select("*")
    .eq("car_id", carId)
    .maybeSingle();

  if (error) {
    console.error("[BlocketSync] Error fetching sync record:", error);
    throw new Error(`Failed to fetch sync record: ${error.message}`);
  }

  return data as BlocketAdSync | null;
}

async function upsertSyncRecord(
  record: Partial<BlocketAdSync> & { car_id: string; source_id: string }
) {
  console.log("[BlocketSync] Upserting sync record for car:", record.car_id);
  
  const { error } = await supabase
    .from("blocket_ad_sync")
    .upsert(record, { onConflict: "car_id" });

  if (error) {
    console.error("[BlocketSync] Error upserting sync record:", error);
    throw new Error(`Failed to upsert sync record: ${error.message}`);
  }
}

async function updateSyncRecord(car_id: string, patch: Partial<BlocketAdSync>) {
  console.log("[BlocketSync] Updating sync record for car:", car_id);
  
  const { error } = await supabase
    .from("blocket_ad_sync")
    .update(patch)
    .eq("car_id", car_id);

  if (error) {
    console.error("[BlocketSync] Error updating sync record:", error);
    throw new Error(`Failed to update sync record: ${error.message}`);
  }
}

// ====== MAPPNING Car -> Blocket-annons-payload ======

export function mapCarToBlocketPayload(car: Car): any {
  // TODO: Ersätt dessa placeholder-värden med riktiga företagsuppgifter
  // Du kan hämta dessa från companies-tabellen eller konfigurera som env-variabler
  const DEALER_CODE = Deno.env.get("BLOCKET_DEALER_CODE") || "DEMO_DEALER";
  const DEALER_NAME = Deno.env.get("BLOCKET_DEALER_NAME") || "Din Bilhandel";
  const DEALER_PHONE = Deno.env.get("BLOCKET_DEALER_PHONE") || "0700000000";
  const DEALER_EMAIL = Deno.env.get("BLOCKET_DEALER_EMAIL") || "info@example.com";

  return {
    source_id: car.id,
    dealer_code: DEALER_CODE,
    category_id: 1020, // Bilar
    title: `${car.make} ${car.model} ${car.year}`,
    body: car.description || car.notes || `${car.make} ${car.model} från ${car.year}`,
    price: car.price
      ? [
          {
            type: "list",
            amount: car.price,
          },
        ]
      : undefined,
    image_urls: car.image_urls || [],
    contact: {
      name: DEALER_NAME,
      phone: DEALER_PHONE,
      email: DEALER_EMAIL,
    },
    category_fields: {
      registration_number: car.registration_number || undefined,
      mileage: car.mileage || undefined,
      fuel_type: car.fuel || undefined,
      gearbox: car.gearbox || undefined,
      model_year: car.year,
    },
  };
}

// ====== SYNC-SERVICE ======

export class BlocketSyncService {
  /**
   * Entry point: Synka en bil mot Blocket.
   * 
   * Anropa denna när:
   *  - Bil skapas med publish_on_blocket = true
   *  - Bil uppdateras (pris, info, bilder) och publish_on_blocket = true
   *  - Bil markeras såld / tas bort (deleted_at sätts)
   *  - publish_on_blocket togglas
   */
  static async syncCar(carId: string) {
    console.log("[BlocketSync] Starting sync for car:", carId);
    
    const car = await getCarById(carId);
    const sync = await getBlocketSyncByCarId(carId);

    const wantOnBlocket = car.publish_on_blocket && !car.deleted_at;

    if (!wantOnBlocket) {
      // Bilen ska inte vara på Blocket
      if (sync && sync.state !== "deleted") {
        console.log("[BlocketSync] Car should be removed from Blocket");
        await this.deleteOnBlocket(sync.source_id);
        await updateSyncRecord(sync.car_id, {
          state: "deleted",
          last_action: "delete",
          last_synced_at: new Date().toISOString(),
        });
      } else {
        console.log("[BlocketSync] Car not on Blocket, nothing to do");
      }
      return;
    }

    // Bilen ska vara på Blocket
    const payload = mapCarToBlocketPayload(car);
    const sourceId = sync?.source_id || car.id;

    if (!sync || sync.state === "deleted" || sync.state === "none") {
      console.log("[BlocketSync] Creating new ad on Blocket");
      await this.createOnBlocket(sourceId, payload, car);
    } else {
      console.log("[BlocketSync] Updating existing ad on Blocket");
      await this.updateOnBlocket(sourceId, payload, car);
    }
  }

  private static async createOnBlocket(sourceId: string, payload: any, car: Car) {
    // Validera annons först (soft fail)
    await BlocketClient.validateAd(payload).catch((e) => {
      console.warn("[BlocketSync] validateAd failed, continuing anyway:", e.message);
    });

    // Skapa annons
    await BlocketClient.createAd(payload);

    // Spara sync-record
    await upsertSyncRecord({
      car_id: car.id,
      source_id: sourceId,
      state: "created",
      last_action: "create",
      last_action_state: "processing",
      last_synced_at: new Date().toISOString(),
      blocket_ad_id: null,
      blocket_store_id: null,
      last_error: null,
    });

    // Hämta status från Blocket
    await this.refreshStatus(sourceId);
  }

  private static async updateOnBlocket(sourceId: string, payload: any, car: Car) {
    // Validera annons först (soft fail)
    await BlocketClient.validateAd(payload).catch((e) => {
      console.warn("[BlocketSync] validateAd failed, continuing anyway:", e.message);
    });

    // Uppdatera annons
    await BlocketClient.updateAd(sourceId, payload);

    // Uppdatera sync-record
    await updateSyncRecord(car.id, {
      last_action: "update",
      last_action_state: "processing",
      last_synced_at: new Date().toISOString(),
    });

    // Hämta status från Blocket
    await this.refreshStatus(sourceId);
  }

  private static async deleteOnBlocket(sourceId: string) {
    console.log("[BlocketSync] Deleting ad from Blocket:", sourceId);
    await BlocketClient.deleteAd(sourceId);
    await this.refreshStatus(sourceId);
  }

  /**
   * Hämtar /ad/{source_id} + loggar och uppdaterar sync-tabellen med:
   *  - blocket_ad_id
   *  - blocket_store_id
   *  - state (created/deleted)
   *  - senaste action + state
   *  - ev. felmeddelande
   */
  static async refreshStatus(sourceId: string) {
    console.log("[BlocketSync] Refreshing status for:", sourceId);
    
    try {
      const ad = await BlocketClient.getAd(sourceId);

      const state = (ad.state as "created" | "deleted") ?? "created";
      const blocketAdId = ad.blocket_ad_id ?? null;
      const blocketStoreId = ad.blocket_store_id ?? null;

      const logs = (ad.logs || []) as any[];
      const lastLog = logs[0];
      const lastAction = (lastLog?.action as BlocketAdSync["last_action"]) ?? null;
      const lastActionState = (lastLog?.state as BlocketAdSync["last_action_state"]) ?? null;

      const errorLogs = logs.filter((l) => l.state === "error");
      const lastError =
        errorLogs.length > 0
          ? errorLogs[0].message ?? JSON.stringify(errorLogs[0])
          : null;

      await upsertSyncRecord({
        car_id: ad.source_id,
        source_id: ad.source_id,
        blocket_ad_id: blocketAdId,
        blocket_store_id: blocketStoreId,
        state,
        last_action: lastAction,
        last_action_state: lastActionState,
        last_error: lastError,
        last_synced_at: new Date().toISOString(),
      });

      console.log("[BlocketSync] Status refreshed successfully");
    } catch (error: any) {
      console.error("[BlocketSync] Error refreshing status:", error);
      // Spara fel i sync-tabellen
      await updateSyncRecord(sourceId, {
        last_error: error.message,
        last_action_state: "error",
      });
    }
  }

  /**
   * Hämta synkstatus för en bil (för UI/diagnostics)
   */
  static async getStatusForCar(carId: string): Promise<BlocketAdSync | null> {
    return await getBlocketSyncByCarId(carId);
  }
}
