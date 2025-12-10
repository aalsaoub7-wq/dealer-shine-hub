import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get IP from headers (Supabase Edge Functions provide this)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    
    const ipAddress = cfConnectingIp || realIp || forwardedFor?.split(",")[0]?.trim() || "unknown";
    
    console.log("Checking IP:", ipAddress);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if this IP has already registered an admin account
    const { data: existingIp, error } = await supabaseAdmin
      .from("admin_registration_ips")
      .select("id, created_at")
      .eq("ip_address", ipAddress)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found (which is good)
      console.error("Error checking IP:", error);
      throw error;
    }

    if (existingIp) {
      console.log("IP already registered:", ipAddress);
      return new Response(
        JSON.stringify({
          allowed: false,
          message: "Ett admin-konto har redan registrerats från denna IP-adress.",
          ip: ipAddress,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("IP allowed:", ipAddress);
    return new Response(
      JSON.stringify({
        allowed: true,
        ip: ipAddress,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in check-admin-ip:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
