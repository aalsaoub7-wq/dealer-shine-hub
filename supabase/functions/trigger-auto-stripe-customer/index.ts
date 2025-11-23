import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { company_id, user_id } = await req.json();

    console.log(`[TRIGGER] Auto-creating Stripe customer for company: ${company_id}`);

    // Get company and user details
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("name, stripe_customer_id")
      .eq("id", company_id)
      .single();

    if (company?.stripe_customer_id) {
      console.log(`[TRIGGER] Stripe customer already exists`);
      return new Response(
        JSON.stringify({ success: true, message: "Customer already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: user } = await supabaseAdmin.auth.admin.getUserById(user_id);

    if (!user?.user?.email) {
      throw new Error("User email not found");
    }

    // Call create-initial-stripe-customer edge function
    const { data, error } = await supabaseAdmin.functions.invoke(
      "create-initial-stripe-customer",
      {
        body: {
          company_id,
          user_email: user.user.email,
          company_name: company?.name || `Company - ${user.user.email}`,
        },
      }
    );

    if (error) {
      console.error("[TRIGGER] Error creating Stripe customer:", error);
      throw error;
    }

    console.log(`[TRIGGER] Stripe customer created successfully:`, data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[TRIGGER] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
