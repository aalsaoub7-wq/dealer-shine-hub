// Supabase Edge Function: wayke-sync
// HTTP endpoint for syncing a car to Wayke via WaykeSyncService.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { WaykeSyncService } from "../_shared/wayke/waykeSyncService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST is allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = claimsData.claims.sub;

    const body = await req.json();
    const carId = body.carId || body.car_id;
    const imageUrls: string[] | undefined = body.imageUrls;

    if (!carId) {
      return new Response(
        JSON.stringify({ error: "Missing 'carId' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify user has access to this car
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("id, company_id")
      .eq("id", carId)
      .maybeSingle();

    if (carError || !car) {
      return new Response(
        JSON.stringify({ error: "Car not found or access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch per-company credentials from ai_settings using service role
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: aiSettings } = await serviceClient
      .from("ai_settings")
      .select("wayke_client_id, wayke_client_secret, wayke_branch_id")
      .eq("company_id", car.company_id)
      .maybeSingle();

    const credentials = {
      clientId: aiSettings?.wayke_client_id || Deno.env.get("WAYKE_CLIENT_ID") || "",
      clientSecret: aiSettings?.wayke_client_secret || Deno.env.get("WAYKE_CLIENT_SECRET") || "",
      branchId: aiSettings?.wayke_branch_id || Deno.env.get("WAYKE_BRANCH_ID") || "",
    };

    if (!credentials.clientId || !credentials.clientSecret || !credentials.branchId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Wayke-uppgifter saknas. Konfigurera dem i synkdialogen." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[Wayke Edge Function] Syncing car:", carId, "for user:", userId);

    await WaykeSyncService.syncCar(carId, imageUrls, credentials);
    const status = await WaykeSyncService.getStatusForCar(carId);

    return new Response(
      JSON.stringify({ ok: true, message: "Sync completed", status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[Wayke Edge Function] Error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "An internal error occurred while syncing to Wayke" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
