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
    // Extract and validate JWT token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header krävs" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the JWT and get the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Ogiltig eller utgången token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the authenticated user's ID - ignore any userId from request body
    const userId = user.id;

    const { type, code } = await req.json();

    if (!type || !code) {
      throw new Error("type och code krävs");
    }

    if (type !== "email" && type !== "phone") {
      throw new Error("type måste vara 'email' eller 'phone'");
    }

    console.log(`Verifying ${type} code for authenticated user:`, userId);

    // Get user verification record
    const { data: verification, error: fetchError } = await supabaseAdmin
      .from("user_verifications")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError || !verification) {
      console.error("Error fetching verification:", fetchError);
      throw new Error("Verifieringspost hittades inte");
    }

    const codeField = type === "email" ? "email_verification_code" : "phone_verification_code";
    const expiryField = type === "email" ? "email_code_expires_at" : "phone_code_expires_at";
    const verifiedField = type === "email" ? "email_verified" : "phone_verified";

    const storedCode = verification[codeField];
    const expiresAt = verification[expiryField];

    // Check if code matches
    if (storedCode !== code) {
      console.log("Invalid code provided");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Felaktig kod. Försök igen." 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if code is expired
    if (expiresAt && new Date(expiresAt) < new Date()) {
      console.log("Code expired");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Koden har gått ut. Begär en ny kod." 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For phone verification: final check that no other user has this phone verified
    if (type === "phone") {
      const phoneNumber = verification.phone_number;
      
      const { data: existingVerified } = await supabaseAdmin
        .from("user_verifications")
        .select("user_id")
        .eq("phone_number", phoneNumber)
        .eq("phone_verified", true)
        .neq("user_id", userId)
        .maybeSingle();
        
      if (existingVerified) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Detta telefonnummer har redan verifierats av ett annat konto." 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Mark as verified and clear code
    const updateData: Record<string, unknown> = {
      [verifiedField]: true,
      [codeField]: null,
      [expiryField]: null,
    };

    const { error: updateError } = await supabaseAdmin
      .from("user_verifications")
      .update(updateData)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating verification:", updateError);
      throw updateError;
    }

    console.log(`${type} verified successfully for user:`, userId);

    // Check if fully verified
    const { data: updatedVerification } = await supabaseAdmin
      .from("user_verifications")
      .select("email_verified, phone_verified")
      .eq("user_id", userId)
      .single();

    const fullyVerified = updatedVerification?.email_verified && updatedVerification?.phone_verified;

    return new Response(
      JSON.stringify({ 
        success: true,
        fullyVerified,
        emailVerified: updatedVerification?.email_verified,
        phoneVerified: updatedVerification?.phone_verified,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-code:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
