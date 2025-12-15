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

// Plan tier order for determining upgrade vs downgrade
const PLAN_TIERS = { start: 1, pro: 2, elit: 3 };

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

    // Get current subscription - first list to find ID, then retrieve for full data
    const subscriptions = await stripe.subscriptions.list({
      customer: company.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found");
    }

    // Always retrieve full subscription to ensure we have all fields
    const subscription = await stripe.subscriptions.retrieve(subscriptions.data[0].id);
    logStep("Found subscription", { 
      subscriptionId: subscription.id,
      currentPeriodEnd: subscription.current_period_end 
    });

    // Get current plan from database (and period end as fallback for scheduled downgrades)
    const { data: currentSub } = await supabaseClient
      .from("subscriptions")
      .select("plan, current_period_end")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    const currentPlan = currentSub?.plan || 'start';
    const currentTier = PLAN_TIERS[currentPlan as keyof typeof PLAN_TIERS] || 1;
    const newTier = PLAN_TIERS[newPlan as keyof typeof PLAN_TIERS];
    const isUpgrade = newTier > currentTier;
    const isDowngrade = newTier < currentTier;

    logStep("Plan change type", { currentPlan, newPlan, isUpgrade, isDowngrade });

    if (!isUpgrade && !isDowngrade) {
      return new Response(
        JSON.stringify({ success: true, message: "Samma plan, ingen ändring behövs" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

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

    if (isUpgrade) {
      // UPGRADE: Apply immediately with proration
      logStep("Processing upgrade - immediate effect");
      
      await stripe.subscriptions.update(subscription.id, {
        items: [
          { id: monthlyItem.id, deleted: true },
          { id: meteredItem.id, deleted: true },
          { price: newPrices.monthly },
          { price: newPrices.metered },
        ],
        proration_behavior: 'create_prorations',
      });

      // Update subscription plan in database immediately
      await supabaseClient
        .from("subscriptions")
        .update({ 
          plan: newPlan, 
          scheduled_plan: null,
          scheduled_plan_date: null,
          updated_at: new Date().toISOString() 
        })
        .eq("stripe_subscription_id", subscription.id);

      logStep("Upgrade completed immediately", { newPlan });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Uppgraderad till ${newPlan}`,
          effectiveDate: 'immediate',
          subscriptionId: subscription.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );

    } else {
      // DOWNGRADE: Schedule for next billing period
      // We don't change Stripe immediately - we store the scheduled change
      // and the stripe-webhook will apply it when the period ends
      logStep("Processing downgrade - scheduling for next billing period");

      // Stripe should provide this, but in some cases it can be missing in the response.
      // Fallback to the backend's stored period end (kept in sync by the webhook).
      let currentPeriodEnd: Date | null = null;

      const stripePeriodEnd = (subscription as any).current_period_end;
      if (typeof stripePeriodEnd === "number" && Number.isFinite(stripePeriodEnd)) {
        currentPeriodEnd = new Date(stripePeriodEnd * 1000);
      }

      if (!currentPeriodEnd && currentSub?.current_period_end) {
        const fromDb = new Date(currentSub.current_period_end);
        if (!Number.isNaN(fromDb.getTime())) {
          currentPeriodEnd = fromDb;
        }
      }

      if (!currentPeriodEnd) {
        logStep("Missing current_period_end", {
          subscriptionId: subscription.id,
          stripe_current_period_end: stripePeriodEnd,
          db_current_period_end: currentSub?.current_period_end ?? null,
        });
        throw new Error(`Invalid current_period_end: ${String(stripePeriodEnd)}`);
      }

      const formattedDate = `${currentPeriodEnd.getFullYear()}-${String(currentPeriodEnd.getMonth() + 1).padStart(2, '0')}-${String(currentPeriodEnd.getDate()).padStart(2, '0')}`;

      // Update database with scheduled change (Stripe subscription unchanged for now)
      await supabaseClient
        .from("subscriptions")
        .update({
          scheduled_plan: newPlan,
          scheduled_plan_date: currentPeriodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      logStep("Downgrade scheduled in database", { newPlan, effectiveDate: currentPeriodEnd.toISOString() });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Plan ändras till ${newPlan} den ${formattedDate}`,
          effectiveDate: currentPeriodEnd.toISOString(),
          subscriptionId: subscription.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});