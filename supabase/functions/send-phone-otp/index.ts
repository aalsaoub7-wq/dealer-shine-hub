import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let digits = phone.replace(/\D/g, "");
  
  // Handle Swedish formats
  if (digits.startsWith("46")) {
    return "+" + digits;
  } else if (digits.startsWith("0")) {
    return "+46" + digits.substring(1);
  } else if (digits.length === 9) {
    // Assume Swedish number without leading 0
    return "+46" + digits;
  }
  
  return "+" + digits;
}

function isValidSwedishNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Swedish mobile numbers: +46 7X XXX XX XX (10 digits after +46)
  const swedishMobileRegex = /^\+467\d{8}$/;
  return swedishMobileRegex.test(formatted);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, phoneNumber } = await req.json();

    if (!userId || !phoneNumber) {
      throw new Error("userId och phoneNumber krävs");
    }

    // Validate and format phone number
    if (!isValidSwedishNumber(phoneNumber)) {
      return new Response(
        JSON.stringify({ 
          error: "Ogiltigt svenskt mobilnummer. Ange ett nummer som börjar med 07." 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log("Sending SMS to:", formattedPhone);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if phone number is already verified by another user
    const { data: existingPhone } = await supabaseAdmin
      .from("user_verifications")
      .select("user_id")
      .eq("phone_number", formattedPhone)
      .eq("phone_verified", true)
      .neq("user_id", userId)
      .maybeSingle();

    if (existingPhone) {
      return new Response(
        JSON.stringify({ 
          error: "Detta telefonnummer är redan registrerat på ett annat konto." 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate 6-digit code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save code and phone to database
    const { error: updateError } = await supabaseAdmin
      .from("user_verifications")
      .update({
        phone_number: formattedPhone,
        phone_verification_code: code,
        phone_code_expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error saving code:", updateError);
      throw updateError;
    }

    // Send SMS via Vonage
    const vonageApiKey = Deno.env.get("VONAGE_API_KEY");
    const vonageApiSecret = Deno.env.get("VONAGE_API_SECRET");
    const vonageFromNumber = Deno.env.get("VONAGE_FROM_NUMBER");

    if (!vonageApiKey || !vonageApiSecret) {
      throw new Error("Vonage credentials not configured");
    }

    const smsResponse = await fetch("https://rest.nexmo.com/sms/json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: vonageApiKey,
        api_secret: vonageApiSecret,
        from: vonageFromNumber || "Luvero",
        to: formattedPhone.replace("+", ""),
        text: `Din Luvero verifieringskod är: ${code}. Koden är giltig i 10 minuter.`,
      }),
    });

    const smsResult = await smsResponse.json();
    console.log("Vonage response:", smsResult);

    if (smsResult.messages?.[0]?.status !== "0") {
      console.error("SMS send failed:", smsResult);
      throw new Error(smsResult.messages?.[0]?.["error-text"] || "Failed to send SMS");
    }

    console.log("SMS sent successfully to:", formattedPhone);

    return new Response(
      JSON.stringify({ 
        success: true,
        phone: formattedPhone.replace(/(\+46)(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5"),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-phone-otp:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
