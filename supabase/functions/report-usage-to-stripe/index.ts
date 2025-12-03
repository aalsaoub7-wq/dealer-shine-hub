import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Get user's company
    const { data: userCompany, error: companyError } = await supabase
      .from("user_companies")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (companyError || !userCompany) {
      throw new Error("Company not found");
    }

    // Get company's subscription with plan
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*, plan")
      .eq("company_id", userCompany.company_id)
      .eq("status", "active")
      .single();

    if (subError || !subscription) {
      console.error("No active subscription found:", subError);
      throw new Error("No active subscription found");
    }

    console.log(`[REPORT-USAGE] Subscription plan: ${subscription.plan || 'start'}`);

    // Get the subscription from Stripe to find the metered subscription item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    if (!stripeSubscription.items.data.length) {
      throw new Error("No subscription items found");
    }

    // Find the metered subscription item (not the fixed monthly one)
    const meteredItem = stripeSubscription.items.data.find(
      (item: any) => item.price.recurring?.usage_type === 'metered'
    );

    if (!meteredItem) {
      console.error("No metered subscription item found");
      throw new Error("No metered subscription item found");
    }

    const subscriptionItemId = meteredItem.id;
    console.log(`[REPORT-USAGE] Using metered subscription item: ${subscriptionItemId}`);

    // Parse request body
    const { quantity = 1 } = await req.json();

    // Report usage to Stripe
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      subscriptionItemId,
      {
        quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      }
    );

    console.log(`[REPORT-USAGE] Reported ${quantity} usage to Stripe for plan ${subscription.plan || 'start'}:`, usageRecord.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        usageRecordId: usageRecord.id,
        plan: subscription.plan || 'start'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error reporting usage:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
