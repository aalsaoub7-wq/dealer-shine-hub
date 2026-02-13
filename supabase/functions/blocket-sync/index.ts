// Supabase Edge Function: blocket-sync
// HTTP-endpoint för att synka en bil mot Blocket via BlocketSyncService.
//
// Endpoint: POST /functions/v1/blocket-sync
// Body: { "carId": "<car-id>" }
//
// Denna funktion kan anropas:
//  1. Manuellt från UI (t.ex. en "Synka till Blocket"-knapp)
//  2. Automatiskt från andra edge functions/triggers
//  3. Via webhooks/scheduled jobs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BlocketSyncService } from "../_shared/blocket/blocketSyncService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST is allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get JWT from authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client with user's JWT to verify auth and check permissions
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const carId = body.carId || body.car_id;
    const imageUrls: string[] | undefined = body.imageUrls;
    
    if (!carId) {
      return new Response(
        JSON.stringify({ error: "Missing 'carId' in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify user has access to this car (belongs to same company)
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("id, company_id")
      .eq("id", carId)
      .maybeSingle();

    if (carError || !car) {
      return new Response(
        JSON.stringify({ error: "Car not found or access denied" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("[Blocket Edge Function] Syncing car:", carId, "for user:", user.id);

    // Kör sync
    await BlocketSyncService.syncCar(carId, imageUrls);

    // Hämta och returnera status
    const status = await BlocketSyncService.getStatusForCar(carId);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: "Sync completed",
        status 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("[Blocket Edge Function] Error:", error);
    // Return generic error message to client, log details server-side only
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: "An internal error occurred while syncing to Blocket"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
