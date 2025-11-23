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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(
        JSON.stringify({
          customerId: company.stripe_customer_id,
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

    // Create subscription with both monthly fee and metered billing
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          // Monthly fixed fee: 239 SEK/month
          price: "price_1SWQj4RrATtOsqxEX5ZWPNld",
        },
        {
          // Metered billing: 4.95 SEK per edited image
          price: "price_1SVYkmRrATtOsqxEkpteepcs",
        }
      ],
      trial_end: trialEnd, // 21-day trial period
      proration_behavior: 'none',
    });

    console.log("Created Stripe subscription:", subscription.id);

    // Save subscription to database using admin client
    const { error: subError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        company_id: company.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        status: subscription.status,
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
