// waykeSyncService.ts
// Sync service for Wayke, supports per-company credentials.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { WaykeClient } from "./waykeClient.ts";
import type { WaykeCredentials } from "./waykeClient.ts";
import type { WaykeAdSync } from "./waykeTypes.ts";
import type { Car } from "../blocket/blocketTypes.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

async function getWaykeSyncByCarId(carId: string): Promise<WaykeAdSync | null> {
  const { data, error } = await supabase
    .from("wayke_ad_sync")
    .select("*")
    .eq("car_id", carId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch wayke sync record: ${error.message}`);
  }
  return data as WaykeAdSync | null;
}

async function upsertSyncRecord(record: Partial<WaykeAdSync> & { car_id: string; source_id: string }) {
  const { error } = await supabase
    .from("wayke_ad_sync")
    .upsert(record, { onConflict: "car_id" });

  if (error) {
    throw new Error(`Failed to upsert wayke sync record: ${error.message}`);
  }
}

async function updateSyncRecord(carId: string, patch: Partial<WaykeAdSync>) {
  const { error } = await supabase
    .from("wayke_ad_sync")
    .update(patch)
    .eq("car_id", carId);

  if (error) {
    throw new Error(`Failed to update wayke sync record: ${error.message}`);
  }
}

function mapCarToWaykePayload(car: Car, imageUrls: string[], branchId: string): any {
  return {
    branch: branchId,
    marketCode: "SE",
    status: "Published",
    vehicle: {
      registrationNumber: car.registration_number || undefined,
      vin: car.vin || undefined,
      mileage: car.mileage || undefined,
      modelYear: car.year,
      fuelType: car.fuel || undefined,
      gearboxType: car.gearbox || undefined,
      manufacturer: car.make,
      modelSeries: car.model,
      color: car.color || undefined,
    },
    ad: {
      price: car.price || undefined,
      shortDescription: `${car.make} ${car.model} ${car.year}`,
      description: car.description || car.notes || `${car.make} ${car.model} från ${car.year}`,
      media: imageUrls.map((url, i) => ({
        type: "Image",
        fileUrls: [url],
        sortOrder: i + 1,
      })),
    },
  };
}

export class WaykeSyncService {
  static async syncCar(carId: string, imageUrls?: string[], creds?: WaykeCredentials) {
    console.log("[WaykeSync] Starting sync for car:", carId);

    if (!creds || !creds.clientId || !creds.clientSecret || !creds.branchId) {
      throw new Error("[WaykeSync] Wayke credentials are required.");
    }

    const car = await getCarById(carId);
    const sync = await getWaykeSyncByCarId(carId);
    const urls = imageUrls && imageUrls.length > 0 ? imageUrls : (car.image_urls || []);

    if (car.deleted_at) {
      if (sync && sync.wayke_vehicle_id && sync.state !== "deleted") {
        console.log("[WaykeSync] Car deleted, removing from Wayke");
        try {
          await WaykeClient.updateVehicleStatus(sync.wayke_vehicle_id, "Deleted", creds);
        } catch (e: any) {
          console.warn("[WaykeSync] Error deleting from Wayke:", e.message);
        }
        await updateSyncRecord(carId, {
          state: "deleted",
          last_action: "delete",
          last_action_state: "success",
          last_synced_at: new Date().toISOString(),
        });
      }
      return;
    }

    const payload = mapCarToWaykePayload(car, urls, creds.branchId);

    if (!sync || sync.state === "deleted" || sync.state === "none") {
      await this.createOnWayke(payload, car, urls, creds);
    } else {
      await this.updateOnWayke(sync.wayke_vehicle_id!, payload, car, urls, creds);
    }
  }

  private static async createOnWayke(payload: any, car: Car, imageUrls: string[], creds: WaykeCredentials) {
    try {
      const result = await WaykeClient.createVehicle(payload, creds);
      const vehicleId = result?.id || result?.vehicleId || null;

      await upsertSyncRecord({
        car_id: car.id,
        source_id: car.id,
        wayke_vehicle_id: vehicleId,
        state: "created",
        last_action: "create",
        last_action_state: "success",
        last_synced_at: new Date().toISOString(),
        last_error: null,
      });

      if (vehicleId && imageUrls.length > 0) {
        for (let i = 0; i < imageUrls.length; i++) {
          try {
            await WaykeClient.uploadImageByUrl(imageUrls[i], creds.branchId, vehicleId, i + 1, creds);
          } catch (e: any) {
            console.warn(`[WaykeSync] Failed to upload image ${i + 1}:`, e.message);
          }
        }
      }

      console.log("[WaykeSync] Vehicle created successfully:", vehicleId);
    } catch (error: any) {
      console.error("[WaykeSync] Error creating vehicle:", error);
      await upsertSyncRecord({
        car_id: car.id,
        source_id: car.id,
        state: "none",
        last_action: "create",
        last_action_state: "error",
        last_error: error.message,
        last_synced_at: new Date().toISOString(),
      });
      throw error;
    }
  }

  private static async updateOnWayke(vehicleId: string, payload: any, car: Car, imageUrls: string[], creds: WaykeCredentials) {
    try {
      await WaykeClient.updateVehicle(vehicleId, payload, creds);

      if (imageUrls.length > 0) {
        for (let i = 0; i < imageUrls.length; i++) {
          try {
            await WaykeClient.uploadImageByUrl(imageUrls[i], creds.branchId, vehicleId, i + 1, creds);
          } catch (e: any) {
            console.warn(`[WaykeSync] Failed to upload image ${i + 1}:`, e.message);
          }
        }
      }

      await updateSyncRecord(car.id, {
        last_action: "update",
        last_action_state: "success",
        last_synced_at: new Date().toISOString(),
        last_error: null,
      });

      console.log("[WaykeSync] Vehicle updated successfully");
    } catch (error: any) {
      console.error("[WaykeSync] Error updating vehicle:", error);
      await updateSyncRecord(car.id, {
        last_action: "update",
        last_action_state: "error",
        last_error: error.message,
        last_synced_at: new Date().toISOString(),
      });
      throw error;
    }
  }

  static async getStatusForCar(carId: string): Promise<WaykeAdSync | null> {
    return await getWaykeSyncByCarId(carId);
  }
}
