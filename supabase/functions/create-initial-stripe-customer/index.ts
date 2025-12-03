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

// Plan price IDs - both monthly and metered for each tier
const PLAN_PRICES = {
  start: {
    monthly: "price_1SaG7tRrATtOsqxE8nAWiFuY",
    metered: "price_1SaGraRrATtOsqxE9qIFXSax",
  },
  pro: {
    monthly: "price_1SaG85RrATtOsqxEFU109fpS",
    metered: "price_1SaGsbRrATtOsqxEj14M7j1A",
  },
  elit: {
    monthly: "price_1SaG86RrATtOsqxEYMD9EfdF",
    metered: "price_1SaGsvRrATtOsqxEtH1fjQmG",
  },
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

    const { company_id, user_email, company_name, plan } = await req.json();
    const selectedPlan = plan || "start";
    const planPrices = PLAN_PRICES[selectedPlan as keyof typeof PLAN_PRICES] || PLAN_PRICES.start;

    console.log(`[AUTO-STRIPE] Creating customer for company: ${company_id}, plan: ${selectedPlan}`);

    // Check if customer already exists
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("stripe_customer_id, trial_end_date")
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

    // Create Stripe customer with plan metadata
    const customer = await stripe.customers.create({
      email: user_email,
      name: company_name,
      metadata: {
        company_id: company_id,
        plan: selectedPlan,
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

    // Calculate trial end timestamp for Stripe (21 days from now or use existing trial_end_date)
    let trialEndTimestamp: number;
    if (company?.trial_end_date) {
      trialEndTimestamp = Math.floor(new Date(company.trial_end_date).getTime() / 1000);
    } else {
      trialEndTimestamp = Math.floor(Date.now() / 1000) + (21 * 24 * 60 * 60);
    }

    // Create subscription with both monthly and metered prices
    console.log(`[AUTO-STRIPE] Creating subscription with plan: ${selectedPlan}, trial_end: ${trialEndTimestamp}`);
    
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        { price: planPrices.monthly },
        { price: planPrices.metered },
      ],
      trial_end: trialEndTimestamp,
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      metadata: {
        company_id: company_id,
        plan: selectedPlan,
      },
    });

    console.log(`[AUTO-STRIPE] Subscription created: ${subscription.id}`);

    // Save subscription to database
    const { error: subError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        company_id: company_id,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        plan: selectedPlan,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      });

    if (subError) {
      console.error("[AUTO-STRIPE] Error saving subscription:", subError);
      // Don't throw - customer and Stripe subscription are created, DB record is secondary
    } else {
      console.log(`[AUTO-STRIPE] Subscription saved to database`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        customerId: customer.id,
        subscriptionId: subscription.id,
        plan: selectedPlan,
        message: "Stripe customer and subscription created successfully",
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
