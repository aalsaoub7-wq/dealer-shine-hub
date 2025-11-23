import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2025-08-27.basil",
});

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

    const { company_id, user_email, company_name } = await req.json();

    console.log(`[AUTO-STRIPE] Creating customer for company: ${company_id}`);

    // Check if customer already exists
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("stripe_customer_id")
      .eq("id", company_id)
      .single();

    if (company?.stripe_customer_id) {
      console.log(`[AUTO-STRIPE] Customer already exists: ${company.stripe_customer_id}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          customerId: company.stripe_customer_id,
          message: "Customer already exists" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Stripe customer (without subscription - that's created when payment method is added)
    const customer = await stripe.customers.create({
      email: user_email,
      name: company_name,
      metadata: {
        company_id: company_id,
      },
    });

    console.log(`[AUTO-STRIPE] Stripe customer created: ${customer.id}`);

    // Update company with Stripe customer ID
    const { error: updateError } = await supabaseAdmin
      .from("companies")
      .update({ stripe_customer_id: customer.id })
      .eq("id", company_id);

    if (updateError) {
      console.error("[AUTO-STRIPE] Error updating company:", updateError);
      throw updateError;
    }

    console.log(`[AUTO-STRIPE] Company updated with customer ID`);

    return new Response(
      JSON.stringify({
        success: true,
        customerId: customer.id,
        message: "Stripe customer created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[AUTO-STRIPE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
