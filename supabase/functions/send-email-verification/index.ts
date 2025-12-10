import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      throw new Error("userId och email krävs");
    }

    console.log("Sending email verification to:", email);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate 6-digit code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save code to database
    const { error: updateError } = await supabaseAdmin
      .from("user_verifications")
      .update({
        email_verification_code: code,
        email_code_expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error saving code:", updateError);
      throw updateError;
    }

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Luvero <noreply@luvero.se>",
      to: [email],
      subject: "Verifiera din e-postadress - Luvero",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0;">
                <span style="background: linear-gradient(135deg, #ffffff 0%, #ef4444 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Luvero</span>
              </h1>
              <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 32px 0;">Professionella bilfoton på sekunder</p>
              
              <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px 0;">Verifiera din e-postadress</h2>
              <p style="color: #d4d4d8; font-size: 16px; margin: 0 0 24px 0;">Använd koden nedan för att verifiera ditt konto:</p>
              
              <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff;">${code}</span>
              </div>
              
              <p style="color: #71717a; font-size: 14px; margin: 0;">Koden är giltig i 15 minuter.</p>
            </div>
            
            <p style="color: #71717a; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
              Om du inte begärde denna verifiering kan du ignorera detta meddelande.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-verification:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  }
});
