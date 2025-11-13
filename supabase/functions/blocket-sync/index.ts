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

    const body = await req.json();
    const carId = body.carId || body.car_id;
    
    if (!carId) {
      return new Response(
        JSON.stringify({ error: "Missing 'carId' in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("[Blocket Edge Function] Syncing car:", carId);

    // Kör sync
    await BlocketSyncService.syncCar(carId);

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
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
