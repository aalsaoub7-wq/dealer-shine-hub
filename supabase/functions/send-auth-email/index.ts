import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Send email using Resend REST API
async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Luvero <noreply@luvero.se>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send email");
  }

  return response.json();
}

const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
}

interface WebhookPayload {
  user: {
    email: string;
  };
  email_data: EmailData;
}

const getEmailContent = (
  emailActionType: string,
  resetLink: string,
  token: string
): { subject: string; html: string } => {
  const logoUrl = "https://luvero.se/favicon.png";
  
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    background-color: #ffffff;
  `;

  const buttonStyles = `
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    padding: 14px 28px;
    text-decoration: none;
    border-radius: 8px;
    display: inline-block;
    font-weight: 600;
    font-size: 16px;
  `;

  const footerStyles = `
    color: #9ca3af;
    font-size: 12px;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
  `;

  switch (emailActionType) {
    case "recovery":
      return {
        subject: "Återställ ditt lösenord på Luvero",
        html: `
          <div style="${baseStyles}">
            <img src="${logoUrl}" alt="Luvero" style="height: 40px; margin-bottom: 32px;" />
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Återställ ditt lösenord</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Vi har tagit emot en begäran om att återställa lösenordet för ditt Luvero-konto. 
              Klicka på knappen nedan för att skapa ett nytt lösenord.
            </p>
            <a href="${resetLink}" style="${buttonStyles}">
              Återställ lösenord
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              Eller kopiera och klistra in denna länk i din webbläsare:
            </p>
            <p style="color: #dc2626; font-size: 14px; word-break: break-all;">
              ${resetLink}
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">
              Om du inte begärde en lösenordsåterställning kan du ignorera detta meddelande. 
              Länken är giltig i 24 timmar.
            </p>
            <div style="${footerStyles}">
              <p>© ${new Date().getFullYear()} Luvero. Alla rättigheter förbehållna.</p>
              <p style="margin-top: 8px;">
                <a href="https://luvero.se" style="color: #dc2626; text-decoration: none;">luvero.se</a>
              </p>
            </div>
          </div>
        `,
      };

    case "signup":
    case "email_confirmation":
      return {
        subject: "Välkommen till Luvero!",
        html: `
          <div style="${baseStyles}">
            <img src="${logoUrl}" alt="Luvero" style="height: 40px; margin-bottom: 32px;" />
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Välkommen till Luvero! 🎉</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Tack för att du registrerade dig! Klicka på knappen nedan för att bekräfta din e-postadress 
              och aktivera ditt konto.
            </p>
            <a href="${resetLink}" style="${buttonStyles}">
              Bekräfta e-postadress
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              Din testperiod på 21 dagar börjar nu – du har tillgång till alla funktioner utan kostnad!
            </p>
            <div style="${footerStyles}">
              <p>© ${new Date().getFullYear()} Luvero. Alla rättigheter förbehållna.</p>
              <p style="margin-top: 8px;">
                <a href="https://luvero.se" style="color: #dc2626; text-decoration: none;">luvero.se</a>
              </p>
            </div>
          </div>
        `,
      };

    case "magiclink":
      return {
        subject: "Logga in på Luvero",
        html: `
          <div style="${baseStyles}">
            <img src="${logoUrl}" alt="Luvero" style="height: 40px; margin-bottom: 32px;" />
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Logga in på Luvero</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Klicka på knappen nedan för att logga in på ditt Luvero-konto.
            </p>
            <a href="${resetLink}" style="${buttonStyles}">
              Logga in
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              Eller använd denna kod: <strong style="color: #1a1a1a;">${token}</strong>
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">
              Om du inte begärde denna inloggning kan du ignorera detta meddelande.
            </p>
            <div style="${footerStyles}">
              <p>© ${new Date().getFullYear()} Luvero. Alla rättigheter förbehållna.</p>
              <p style="margin-top: 8px;">
                <a href="https://luvero.se" style="color: #dc2626; text-decoration: none;">luvero.se</a>
              </p>
            </div>
          </div>
        `,
      };

    case "invite":
      return {
        subject: "Du har blivit inbjuden till Luvero",
        html: `
          <div style="${baseStyles}">
            <img src="${logoUrl}" alt="Luvero" style="height: 40px; margin-bottom: 32px;" />
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Du har blivit inbjuden!</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Du har blivit inbjuden att gå med i Luvero. Klicka på knappen nedan för att acceptera 
              inbjudan och skapa ditt konto.
            </p>
            <a href="${resetLink}" style="${buttonStyles}">
              Acceptera inbjudan
            </a>
            <div style="${footerStyles}">
              <p>© ${new Date().getFullYear()} Luvero. Alla rättigheter förbehållna.</p>
              <p style="margin-top: 8px;">
                <a href="https://luvero.se" style="color: #dc2626; text-decoration: none;">luvero.se</a>
              </p>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: "Meddelande från Luvero",
        html: `
          <div style="${baseStyles}">
            <img src="${logoUrl}" alt="Luvero" style="height: 40px; margin-bottom: 32px;" />
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Meddelande från Luvero</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Klicka på knappen nedan för att fortsätta.
            </p>
            <a href="${resetLink}" style="${buttonStyles}">
              Fortsätt
            </a>
            <div style="${footerStyles}">
              <p>© ${new Date().getFullYear()} Luvero. Alla rättigheter förbehållna.</p>
            </div>
          </div>
        `,
      };
  }
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify webhook signature
    const wh = new Webhook(hookSecret);
    const { user, email_data } = wh.verify(payload, headers) as WebhookPayload;

    console.log(`[SEND-AUTH-EMAIL] Processing ${email_data.email_action_type} for ${user.email}`);

    // Build the action link
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const actionLink = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;

    // Get email content based on action type
    const { subject, html } = getEmailContent(
      email_data.email_action_type,
      actionLink,
      email_data.token
    );

    // Send email via Resend
    const data = await sendEmail(user.email, subject, html);
    console.log(`[SEND-AUTH-EMAIL] Email sent successfully:`, data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[SEND-AUTH-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
