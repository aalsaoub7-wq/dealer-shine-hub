// blocketSyncService.ts
// Huvudlogiken som håller Blocket-annonser synkade med din plattform.
// Följer Pro Import API v3 OpenAPI-spec för Car (category 1020).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BlocketClient } from "./blocketClient.ts";
import type {
  Car,
  BlocketAdSync,
  BlocketAdPayload,
  BlocketFuel,
  BlocketTransmission,
} from "./blocketTypes.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface BlocketCredentials {
  apiToken: string;
  dealerCode?: string;
  // Following fields kept for backwards-compat with edge function signature,
  // but they are NOT used in the payload — Blocket pulls contact info from the store.
  dealerName?: string;
  dealerPhone?: string;
  dealerEmail?: string;
}

// Placeholders for required fields when the car has no real data yet.
// Brand/model/body_type MUST be values that Blocket validates against — the user
// can change them in Blocket once the ad is created (it stays invisible until then).
const PLACEHOLDER_BRAND = "Volvo";
const PLACEHOLDER_MODEL = "240";
const PLACEHOLDER_BODY_TYPE = "sedan";
const PLACEHOLDER_TEXT = "FYLL";
const PLACEHOLDER_YEAR = 1900;
const PLACEHOLDER_PRICE = 1;
const MAX_IMAGES = 38;

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

// ---- Field mapping helpers ----

function mapFuel(value: string | null | undefined): BlocketFuel | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().trim();
  if (["gasoline", "bensin", "petrol"].includes(v)) return "gasoline";
  if (["diesel"].includes(v)) return "diesel";
  if (["electric", "el", "elektrisk"].includes(v)) return "electric";
  if (["ethanol", "etanol", "e85"].includes(v)) return "ethanol";
  if (["natural_gas", "gas", "fordonsgas", "cng"].includes(v)) return "natural_gas";
  return undefined;
}

function mapTransmission(value: string | null | undefined): BlocketTransmission | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().trim();
  if (["manual", "manuell"].includes(v)) return "manual";
  if (["automatic", "automat", "automatisk"].includes(v)) return "automatic";
  if (["sequential", "sekventiell"].includes(v)) return "sequential";
  return undefined;
}

function sanitizeImageUrls(urls: string[] | undefined): string[] {
  if (!urls) return [];
  return urls
    .filter((u): u is string => typeof u === "string")
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, MAX_IMAGES);
}

// ---- Payload mapping ----

export function mapCarToBlocketPayload(
  car: Car,
  imageUrls?: string[],
  creds?: BlocketCredentials,
): BlocketAdPayload {
  const images = sanitizeImageUrls(
    imageUrls && imageUrls.length > 0 ? imageUrls : car.image_urls,
  );

  // Required fields with placeholder fallback (Blocket-validated values)
  const brand = (car.make || "").trim() || PLACEHOLDER_BRAND;
  const model = (car.model || "").trim() || PLACEHOLDER_MODEL;
  const modelYear =
    car.year && car.year >= 1900 && car.year <= 2100 ? car.year : PLACEHOLDER_YEAR;
  const bodyType = PLACEHOLDER_BODY_TYPE; // not yet stored on cars table

  const body =
    (car.description && car.description.trim()) ||
    (car.notes && car.notes.trim()) ||
    PLACEHOLDER_TEXT;

  const priceAmount =
    typeof car.price === "number" && car.price > 0 ? car.price : PLACEHOLDER_PRICE;

  // Track whether we used any placeholders → keep ad invisible until real data arrives
  const usedPlaceholder =
    brand === PLACEHOLDER_BRAND ||
    model === PLACEHOLDER_MODEL ||
    bodyType === PLACEHOLDER_BODY_TYPE ||
    modelYear === PLACEHOLDER_YEAR ||
    body === PLACEHOLDER_TEXT ||
    priceAmount === PLACEHOLDER_PRICE;

  // Build category_fields per OpenAPI spec
  const category_fields: BlocketAdPayload["category_fields"] = {
    brand,
    model,
    model_year: modelYear,
    body_type: bodyType,
  };

  if (car.registration_number) {
    category_fields.registration_number = car.registration_number.slice(0, 6);
  }
  if (car.vin) category_fields.vin = car.vin;
  if (car.color) category_fields.color = car.color;

  if (typeof car.mileage === "number" && car.mileage >= 0) {
    category_fields.condition = {
      mileage: { value: car.mileage, unit: "km" },
    };
  }

  const fuel = mapFuel(car.fuel);
  const transmission = mapTransmission(car.gearbox);
  if (fuel || transmission) {
    category_fields.powertrain = {};
    if (fuel) category_fields.powertrain.fuels = [fuel];
    if (transmission) category_fields.powertrain.transmission = transmission;
  }

  const payload: BlocketAdPayload = {
    source_id: car.id,
    category_id: 1020,
    body,
    price: [{ type: "list", amount: priceAmount }],
    image_urls: images,
    visible: !usedPlaceholder,
    category_fields,
  };

  // Only include dealer_code when the token-scope is dealer_group
  // (omit otherwise — sending it with a dealer_code-scoped token causes errors)
  if (creds?.dealerCode && creds.dealerCode.trim()) {
    payload.dealer_code = creds.dealerCode.trim();
  }

  return payload;
}

export class BlocketSyncService {
  static async syncCar(
    carId: string,
    imageUrls?: string[],
    creds?: BlocketCredentials,
    forceSync?: boolean,
  ) {
    console.log("[BlocketSync] Starting sync for car:", carId, "forceSync:", forceSync);

    if (!creds?.apiToken && !Deno.env.get("BLOCKET_API_TOKEN")) {
      throw new Error(
        "Blocket-token saknas. Lägg in den i Inställningar → Plattformar → Blocket.",
      );
    }

    const car = await getCarById(carId);
    const sync = await getBlocketSyncByCarId(carId);
    const token = creds?.apiToken || undefined;

    const wantOnBlocket = forceSync || (car.publish_on_blocket && !car.deleted_at);

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

  private static async createOnBlocket(
    sourceId: string,
    payload: BlocketAdPayload,
    car: Car,
    token?: string,
  ) {
    // Skip separate validateAd — create returns its own validation errors
    try {
      await BlocketClient.createAd(payload, token);
    } catch (e: any) {
      const fallback = applyBrandModelFallback(payload, e);
      if (fallback) {
        console.warn("[BlocketSync] createAd: invalid brand/model, retrying with placeholders");
        try {
          await BlocketClient.createAd(fallback, token);
        } catch (e2: any) {
          console.error("[BlocketSync] createAd fallback failed:", e2?.message);
          await upsertSyncRecord({
            car_id: car.id,
            source_id: sourceId,
            state: "none",
            last_action: "create",
            last_action_state: "error",
            last_synced_at: new Date().toISOString(),
            last_error: e2?.message || String(e2),
          });
          throw e2;
        }
      } else {
        console.error("[BlocketSync] createAd failed:", e?.message);
        await upsertSyncRecord({
          car_id: car.id,
          source_id: sourceId,
          state: "none",
          last_action: "create",
          last_action_state: "error",
          last_synced_at: new Date().toISOString(),
          last_error: e?.message || String(e),
        });
        throw e;
      }
    }

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

  private static async updateOnBlocket(
    sourceId: string,
    payload: BlocketAdPayload,
    car: Car,
    token?: string,
  ) {
    // Skip separate validateAd — update returns its own validation errors
    try {
      await BlocketClient.updateAd(sourceId, payload, token);
    } catch (e: any) {
      const fallback = applyBrandModelFallback(payload, e);
      if (fallback) {
        console.warn("[BlocketSync] updateAd: invalid brand/model, retrying with placeholders");
        try {
          await BlocketClient.updateAd(sourceId, fallback, token);
        } catch (e2: any) {
          console.error("[BlocketSync] updateAd fallback failed:", e2?.message);
          await updateSyncRecord(car.id, {
            last_action: "update",
            last_action_state: "error",
            last_synced_at: new Date().toISOString(),
            last_error: e2?.message || String(e2),
          });
          throw e2;
        }
      } else {
        console.error("[BlocketSync] updateAd failed:", e?.message);
        await updateSyncRecord(car.id, {
          last_action: "update",
          last_action_state: "error",
          last_synced_at: new Date().toISOString(),
          last_error: e?.message || String(e),
        });
        throw e;
      }
    }

    await updateSyncRecord(car.id, {
      last_action: "update",
      last_action_state: "processing",
      last_synced_at: new Date().toISOString(),
      last_error: null,
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
      const lastActionState =
        (lastLog?.state as BlocketAdSync["last_action_state"]) ?? null;

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
