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
    const { userId, ipAddress } = await req.json();

    if (!userId || !ipAddress) {
      throw new Error("userId och ipAddress krävs");
    }

    console.log("Saving admin IP:", ipAddress, "for user:", userId);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Save IP to database
    const { error } = await supabaseAdmin
      .from("admin_registration_ips")
      .insert({
        ip_address: ipAddress,
        user_id: userId,
      });

    if (error) {
      // Ignore duplicate key error
      if (error.code === "23505") {
        console.log("IP already saved (duplicate)");
      } else {
        console.error("Error saving IP:", error);
        throw error;
      }
    }

    // Also save IP to user_verifications
    await supabaseAdmin
      .from("user_verifications")
      .update({ registration_ip: ipAddress })
      .eq("user_id", userId);

    console.log("Admin IP saved successfully");

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in save-admin-ip:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
