// blocketSyncService.ts
// Huvudlogiken som håller Blocket-annonser synkade med din plattform.
// Supports per-company credentials passed from the edge function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BlocketClient } from "./blocketClient.ts";
import type { Car, BlocketAdSync } from "./blocketTypes.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface BlocketCredentials {
  apiToken: string;
  dealerCode: string;
  dealerName: string;
  dealerPhone: string;
  dealerEmail: string;
}

async function getCarById(carId: string): Promise<Car> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", carId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch car: ${error?.message || "not found"}`);
  }
  return data as Car;
}

async function getBlocketSyncByCarId(carId: string): Promise<BlocketAdSync | null> {
  const { data, error } = await supabase
    .from("blocket_ad_sync")
    .select("*")
    .eq("car_id", carId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch sync record: ${error.message}`);
  }
  return data as BlocketAdSync | null;
}

async function upsertSyncRecord(
  record: Partial<BlocketAdSync> & { car_id: string; source_id: string }
) {
  const { error } = await supabase
    .from("blocket_ad_sync")
    .upsert(record, { onConflict: "car_id" });

  if (error) {
    throw new Error(`Failed to upsert sync record: ${error.message}`);
  }
}

async function updateSyncRecord(car_id: string, patch: Partial<BlocketAdSync>) {
  const { error } = await supabase
    .from("blocket_ad_sync")
    .update(patch)
    .eq("car_id", car_id);

  if (error) {
    throw new Error(`Failed to update sync record: ${error.message}`);
  }
}

export function mapCarToBlocketPayload(car: Car, imageUrls?: string[], creds?: BlocketCredentials): any {
  const DEALER_CODE = creds?.dealerCode || Deno.env.get("BLOCKET_DEALER_CODE") || "DEMO_DEALER";
  const DEALER_NAME = creds?.dealerName || Deno.env.get("BLOCKET_DEALER_NAME") || "Din Bilhandel";
  const DEALER_PHONE = creds?.dealerPhone || Deno.env.get("BLOCKET_DEALER_PHONE") || "0700000000";
  const DEALER_EMAIL = creds?.dealerEmail || Deno.env.get("BLOCKET_DEALER_EMAIL") || "info@example.com";

  return {
    source_id: car.id,
    dealer_code: DEALER_CODE,
    category_id: 1020,
    title: `${car.make} ${car.model} ${car.year}`,
    body: car.description || car.notes || `${car.make} ${car.model} från ${car.year}`,
    price: car.price
      ? [{ type: "list", amount: car.price }]
      : undefined,
    image_urls: imageUrls && imageUrls.length > 0 ? imageUrls : (car.image_urls || []),
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

export class BlocketSyncService {
  static async syncCar(carId: string, imageUrls?: string[], creds?: BlocketCredentials) {
    console.log("[BlocketSync] Starting sync for car:", carId);
    
    const car = await getCarById(carId);
    const sync = await getBlocketSyncByCarId(carId);
    const token = creds?.apiToken || undefined;

    const wantOnBlocket = car.publish_on_blocket && !car.deleted_at;

    if (!wantOnBlocket) {
      if (sync && sync.state !== "deleted") {
        console.log("[BlocketSync] Car should be removed from Blocket");
        await this.deleteOnBlocket(sync.source_id, token);
        await updateSyncRecord(sync.car_id, {
          state: "deleted",
          last_action: "delete",
          last_synced_at: new Date().toISOString(),
        });
      }
      return;
    }

    const payload = mapCarToBlocketPayload(car, imageUrls, creds);
    const sourceId = sync?.source_id || car.id;

    if (!sync || sync.state === "deleted" || sync.state === "none") {
      await this.createOnBlocket(sourceId, payload, car, token);
    } else {
      await this.updateOnBlocket(sourceId, payload, car, token);
    }
  }

  private static async createOnBlocket(sourceId: string, payload: any, car: Car, token?: string) {
    await BlocketClient.validateAd(payload, token).catch((e) => {
      console.warn("[BlocketSync] validateAd failed, continuing anyway:", e.message);
    });

    await BlocketClient.createAd(payload, token);

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

    await this.refreshStatus(sourceId, token);
  }

  private static async updateOnBlocket(sourceId: string, payload: any, car: Car, token?: string) {
    await BlocketClient.validateAd(payload, token).catch((e) => {
      console.warn("[BlocketSync] validateAd failed, continuing anyway:", e.message);
    });

    await BlocketClient.updateAd(sourceId, payload, token);

    await updateSyncRecord(car.id, {
      last_action: "update",
      last_action_state: "processing",
      last_synced_at: new Date().toISOString(),
    });

    await this.refreshStatus(sourceId, token);
  }

  private static async deleteOnBlocket(sourceId: string, token?: string) {
    console.log("[BlocketSync] Deleting ad from Blocket:", sourceId);
    await BlocketClient.deleteAd(sourceId, token);
    await this.refreshStatus(sourceId, token);
  }

  static async refreshStatus(sourceId: string, token?: string) {
    console.log("[BlocketSync] Refreshing status for:", sourceId);
    
    try {
      const ad = await BlocketClient.getAd(sourceId, token);

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
      await updateSyncRecord(sourceId, {
        last_error: error.message,
        last_action_state: "error",
      });
    }
  }

  static async getStatusForCar(carId: string): Promise<BlocketAdSync | null> {
    return await getBlocketSyncByCarId(carId);
  }
}
