import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Live mode price IDs
const PLAN_PRICES = {
  start: {
    monthly: "price_1So6e7RrATtOsqxEBhJWCmr1",
    metered: "price_1So6irRrATtOsqxE37JO8Jzh",
  },
  pro: {
    monthly: "price_1So6gdRrATtOsqxE1IpvCDQD",
    metered: "price_1So6jxRrATtOsqxEBuNnwcpa",
  },
  elit: {
    monthly: "price_1So6hGRrATtOsqxE4w8y3VPE",
    metered: "price_1So6lARrATtOsqxEHvYXCjbt",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan = "start" } = await req.json();
    console.log("Creating checkout session for plan:", plan);

    // Validate plan
    if (!PLAN_PRICES[plan as keyof typeof PLAN_PRICES]) {
      throw new Error("Invalid plan selected");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    
    const user = userData.user;
    console.log("User authenticated:", user.email);

    // Use service role to bypass RLS for company lookup
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user's company
    const { data: userCompany, error: companyError } = await supabaseAdmin
      .from("user_companies")
      .select("company_id, companies(id, stripe_customer_id, name)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (companyError || !userCompany) {
      console.error("Company lookup error:", companyError);
      throw new Error("Could not find user's company");
    }

    const company = Array.isArray(userCompany.companies)
      ? userCompany.companies[0]
      : userCompany.companies;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let customerId = company.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log("No Stripe customer found, creating one...");
      
      const customer = await stripe.customers.create({
        email: user.email,
        name: company.name,
        metadata: {
          company_id: company.id,
        },
      });
      
      customerId = customer.id;
      console.log("Created Stripe customer:", customerId);

      await supabaseAdmin
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", company.id);
    }

    const planPrices = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
    const origin = req.headers.get("origin") || "https://luvero.se";

    // Create checkout session with subscription mode
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: planPrices.monthly,
          quantity: 1,
        },
        {
          price: planPrices.metered,
        },
      ],
      mode: "subscription",
      payment_method_collection: "always",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard`,
      metadata: {
        company_id: company.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          company_id: company.id,
          plan: plan,
        },
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating checkout session:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
