import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Plan pricing configuration - LIVE MODE
const PLAN_PRICES = {
  start: {
    monthly: "price_1SeML8RrATtOsqxESHwTPKKX", // 239 kr/month
    metered: "price_1SeML8RrATtOsqxE0BprZ0kP", // 4.95 kr per image
  },
  pro: {
    monthly: "price_1SeML4RrATtOsqxEq6gwz4Kz", // 449 kr/month
    metered: "price_1SeML4RrATtOsqxEkgED2l0y", // 1.95 kr per image
  },
  elit: {
    monthly: "price_1SeMKzRrATtOsqxEZzSMjJTs", // 995 kr/month
    metered: "price_1SeMKzRrATtOsqxEgmRSvWVa", // 0.99 kr per image
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for plan selection
    let selectedPlan = "start";
    try {
      const body = await req.json();
      if (body.plan && PLAN_PRICES[body.plan as keyof typeof PLAN_PRICES]) {
        selectedPlan = body.plan;
      }
    } catch {
      // No body or invalid JSON, use default plan
    }

    console.log(`[CREATE-STRIPE-CUSTOMER] Creating customer with plan: ${selectedPlan}`);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("No user found");
    }

    // Create admin client for updating companies table
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user's company
    const { data: userCompany } = await supabaseClient
      .from("user_companies")
      .select("company_id, companies(id, name, stripe_customer_id)")
      .eq("user_id", user.id)
      .single();

    if (!userCompany?.companies) {
      throw new Error("No company found for user");
    }

    const company = Array.isArray(userCompany.companies)
      ? userCompany.companies[0]
      : userCompany.companies;

    // Check if customer already exists
    if (company.stripe_customer_id) {
      // Customer exists - check if we need to use plan from metadata
      let planToUse = selectedPlan;
      try {
        const existingCustomer = await stripe.customers.retrieve(company.stripe_customer_id);
        if (existingCustomer && !existingCustomer.deleted && existingCustomer.metadata?.plan) {
          planToUse = existingCustomer.metadata.plan;
          console.log(`[CREATE-STRIPE-CUSTOMER] Using plan from customer metadata: ${planToUse}`);
        }
      } catch (e) {
        console.log("[CREATE-STRIPE-CUSTOMER] Could not retrieve customer metadata");
      }
      
      return new Response(
        JSON.stringify({
          customerId: company.stripe_customer_id,
          plan: planToUse,
          message: "Customer already exists",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: company.name,
      metadata: {
        company_id: company.id,
        user_id: user.id,
        plan: selectedPlan,
      },
    });

    // Update company with Stripe customer ID using admin client
    const { error: updateError } = await supabaseAdmin
      .from("companies")
      .update({ stripe_customer_id: customer.id })
      .eq("id", company.id);

    if (updateError) {
      console.error("Error updating company:", updateError);
      throw updateError;
    }

    console.log("Stripe customer created:", customer.id);

    // Get company's trial_end_date for Stripe trial
    const { data: companyData } = await supabaseAdmin
      .from("companies")
      .select("trial_end_date")
      .eq("id", company.id)
      .single();

    const trialEnd = companyData?.trial_end_date 
      ? Math.floor(new Date(companyData.trial_end_date).getTime() / 1000)
      : undefined;

    // Get plan-specific prices
    const planPrices = PLAN_PRICES[selectedPlan as keyof typeof PLAN_PRICES];

    // Create subscription with both monthly fee and metered billing
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          // Monthly fixed fee based on plan
          price: planPrices.monthly,
        },
        {
          // Metered billing based on plan
          price: planPrices.metered,
        }
      ],
      trial_end: trialEnd, // 21-day trial period
      proration_behavior: 'none',
    });

    console.log(`Created Stripe subscription: ${subscription.id} for plan: ${selectedPlan}`);

    // Save subscription to database using admin client (with plan)
    const { error: subError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        company_id: company.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        status: subscription.status,
        plan: selectedPlan,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      });

    if (subError) {
      console.error("Error saving subscription:", subError);
      // Don't fail - subscription is created in Stripe
    }

    return new Response(
      JSON.stringify({
        customerId: customer.id,
        subscriptionId: subscription.id,
        plan: selectedPlan,
        message: "Customer and subscription created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in create-stripe-customer:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
