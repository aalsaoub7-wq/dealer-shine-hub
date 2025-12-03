import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: RequestBody = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email krävs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      // Don't reveal if user exists or not
      return new Response(
        JSON.stringify({ success: true, message: "Om e-postadressen finns skickas ett återställningsmail." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Don't reveal if user exists - return success anyway for security
      console.log("User not found for email:", email);
      return new Response(
        JSON.stringify({ success: true, message: "Om e-postadressen finns skickas ett återställningsmail." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure token
    const { data: tokenData, error: tokenError } = await supabaseAdmin.rpc('generate_reset_token');
    
    if (tokenError || !tokenData) {
      console.error("Error generating token:", tokenError);
      throw new Error("Kunde inte generera återställningstoken");
    }

    const token = tokenData as string;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Delete any existing tokens for this user
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id);

    // Insert new token
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: token,
        email: email.toLowerCase(),
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting token:", insertError);
      throw new Error("Kunde inte spara återställningstoken");
    }

    // Build reset URL
    const resetUrl = `${redirectUrl}?token=${token}`;

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Luvero <noreply@luvero.se>",
      to: [email],
      subject: "Återställ ditt lösenord - Luvero",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 500px; width: 100%; border-collapse: collapse;">
                  <!-- Logo -->
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <h1 style="margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #ffffff 0%, #ef4444 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        Luvero
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content Card -->
                  <tr>
                    <td style="background: linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 40px 32px; border: 1px solid #262626;">
                      <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                        Återställ ditt lösenord
                      </h2>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
                        Vi har tagit emot en begäran om att återställa lösenordet för ditt Luvero-konto. Klicka på knappen nedan för att välja ett nytt lösenord.
                      </p>
                      
                      <!-- Button -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 8px 0 24px 0;">
                            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">
                              Återställ lösenord
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #737373;">
                        Länken är giltig i 1 timme. Om du inte begärde denna återställning kan du ignorera detta meddelande.
                      </p>
                      
                      <p style="margin: 0; font-size: 12px; color: #525252; word-break: break-all;">
                        Om knappen inte fungerar, kopiera denna länk:<br>
                        <a href="${resetUrl}" style="color: #ef4444;">${resetUrl}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding-top: 32px;">
                      <p style="margin: 0; font-size: 12px; color: #525252;">
                        © ${new Date().getFullYear()} Luvero. Alla rättigheter förbehållna.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error("Kunde inte skicka e-post");
    }

    console.log("Password reset email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Om e-postadressen finns skickas ett återställningsmail." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in request-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Ett fel uppstod" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
