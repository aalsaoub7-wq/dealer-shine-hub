// Supabase Edge Function: blocket-sync
// HTTP-endpoint för att synka en bil mot Blocket via BlocketSyncService.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BlocketSyncService } from "../_shared/blocket/blocketSyncService.ts";

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
      .select("blocket_api_token, blocket_dealer_code, blocket_dealer_name, blocket_dealer_phone, blocket_dealer_email")
      .eq("company_id", car.company_id)
      .maybeSingle();

    const credentials = {
      apiToken: aiSettings?.blocket_api_token || Deno.env.get("BLOCKET_API_TOKEN") || "",
      dealerCode: aiSettings?.blocket_dealer_code || Deno.env.get("BLOCKET_DEALER_CODE") || "DEMO_DEALER",
      dealerName: aiSettings?.blocket_dealer_name || Deno.env.get("BLOCKET_DEALER_NAME") || "Din Bilhandel",
      dealerPhone: aiSettings?.blocket_dealer_phone || Deno.env.get("BLOCKET_DEALER_PHONE") || "0700000000",
      dealerEmail: aiSettings?.blocket_dealer_email || Deno.env.get("BLOCKET_DEALER_EMAIL") || "info@example.com",
    };

    console.log("[Blocket Edge Function] Syncing car:", carId, "for user:", userId);

    await BlocketSyncService.syncCar(carId, imageUrls, credentials);
    const status = await BlocketSyncService.getStatusForCar(carId);

    return new Response(
      JSON.stringify({ ok: true, message: "Sync completed", status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[Blocket Edge Function] Error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "An internal error occurred while syncing to Blocket" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
