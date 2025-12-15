import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Plan pricing configuration - must match usageTracking.ts
const PLAN_PRICES = {
  start: {
    monthly: 'price_1SeML8RrATtOsqxESHwTPKKX',
    metered: 'price_1SeML8RrATtOsqxE0BprZ0kP'
  },
  pro: {
    monthly: 'price_1SeML4RrATtOsqxEq6gwz4Kz',
    metered: 'price_1SeML4RrATtOsqxEkgED2l0y'
  },
  elit: {
    monthly: 'price_1SeMKzRrATtOsqxEZzSMjJTs',
    metered: 'price_1SeMKzRrATtOsqxEgmRSvWVa'
  }
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { newPlan } = await req.json();
    if (!newPlan || !PLAN_PRICES[newPlan as keyof typeof PLAN_PRICES]) {
      throw new Error(`Invalid plan: ${newPlan}`);
    }
    logStep("New plan requested", { newPlan });

    // Get user's company
    const { data: userCompany, error: companyError } = await supabaseClient
      .from("user_companies")
      .select("company_id, companies(id, stripe_customer_id)")
      .eq("user_id", user.id)
      .single();

    if (companyError || !userCompany?.companies) {
      throw new Error("Could not find company for user");
    }

    const company = Array.isArray(userCompany.companies) 
      ? userCompany.companies[0] 
      : userCompany.companies;
    
    if (!company.stripe_customer_id) {
      throw new Error("No Stripe customer ID found");
    }
    logStep("Found company", { companyId: company.id, stripeCustomerId: company.stripe_customer_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: company.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found");
    }

    const subscription = subscriptions.data[0];
    logStep("Found subscription", { subscriptionId: subscription.id });

    // Get current subscription items
    const monthlyItem = subscription.items.data.find((item: any) => {
      const price = item.price;
      return price.recurring?.usage_type !== 'metered';
    });
    const meteredItem = subscription.items.data.find((item: any) => {
      const price = item.price;
      return price.recurring?.usage_type === 'metered';
    });

    if (!monthlyItem || !meteredItem) {
      throw new Error("Could not find subscription items");
    }
    logStep("Found subscription items", { 
      monthlyItemId: monthlyItem.id, 
      meteredItemId: meteredItem.id 
    });

    const newPrices = PLAN_PRICES[newPlan as keyof typeof PLAN_PRICES];

    // Update subscription with new prices
    // Delete old items and add new ones
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        // Remove old items
        { id: monthlyItem.id, deleted: true },
        { id: meteredItem.id, deleted: true },
        // Add new items
        { price: newPrices.monthly },
        { price: newPrices.metered },
      ],
      proration_behavior: 'create_prorations', // Credit for unused time
    });

    logStep("Subscription updated", { 
      subscriptionId: updatedSubscription.id, 
      newPlan 
    });

    // Update subscription plan in database
    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .update({ plan: newPlan, updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscription.id);

    if (updateError) {
      console.error("Error updating subscription in database:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Plan updated to ${newPlan}`,
        subscriptionId: updatedSubscription.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
