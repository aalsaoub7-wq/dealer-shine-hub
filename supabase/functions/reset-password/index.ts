import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  token: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, newPassword }: RequestBody = await req.json();

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Token och nytt lösenord krävs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Lösenordet måste vara minst 6 tecken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length > 72) {
      return new Response(
        JSON.stringify({ error: "Lösenordet får vara max 72 tecken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the token
    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenRecord) {
      console.error("Token not found or already used:", tokenError);
      return new Response(
        JSON.stringify({ error: "Ogiltig eller utgången återställningslänk" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
      console.error("Token expired:", tokenRecord.expires_at);
      return new Response(
        JSON.stringify({ error: "Återställningslänken har gått ut. Begär en ny." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the user's password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenRecord.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new Error("Kunde inte uppdatera lösenordet");
    }

    // Mark token as used
    const { error: markUsedError } = await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRecord.id);

    if (markUsedError) {
      console.error("Error marking token as used:", markUsedError);
      // Don't fail the request, password was already updated
    }

    // Clean up old tokens for this user
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', tokenRecord.user_id)
      .neq('id', tokenRecord.id);

    console.log("Password reset successful for user:", tokenRecord.user_id);

    return new Response(
      JSON.stringify({ success: true, message: "Lösenordet har uppdaterats" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in reset-password:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Ett fel uppstod" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
