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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error("userId krävs");
    }

    console.log("Getting verification status for user:", userId);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user verification record
    const { data: verification, error } = await supabaseAdmin
      .from("user_verifications")
      .select("email_verified, phone_verified, phone_number")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No verification record found - create one
        const { error: insertError } = await supabaseAdmin
          .from("user_verifications")
          .insert({ user_id: userId });

        if (insertError) {
          console.error("Error creating verification:", insertError);
        }

        return new Response(
          JSON.stringify({
            emailVerified: false,
            phoneVerified: false,
            phoneNumber: null,
            fullyVerified: false,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    const fullyVerified = verification?.email_verified && verification?.phone_verified;

    return new Response(
      JSON.stringify({
        emailVerified: verification?.email_verified || false,
        phoneVerified: verification?.phone_verified || false,
        phoneNumber: verification?.phone_number,
        fullyVerified,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in get-verification-status:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
