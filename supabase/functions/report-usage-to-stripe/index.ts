import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
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
      apiVersion: "2024-06-20",
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

    // Admin test account - skip Stripe usage reporting entirely
    const ADMIN_TEST_COMPANY_ID = 'e0496e49-c30b-4fbd-a346-d8dfeacdf1ea';
    
    if (userCompany.company_id === ADMIN_TEST_COMPANY_ID) {
      console.log("[REPORT-USAGE] Admin test account - skipping Stripe usage reporting");
      return new Response(
        JSON.stringify({ 
          success: true,
          skipped: true,
          reason: "Admin test account - Stripe reporting bypassed"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get company's subscription with plan
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*, plan")
      .eq("company_id", userCompany.company_id)
      .eq("status", "active")
      .single();

    // If no active subscription, user is in trial - skip Stripe usage reporting
    if (subError || !subscription) {
      console.log("[REPORT-USAGE] No active subscription found - user likely in trial period, skipping Stripe usage report");
      return new Response(
        JSON.stringify({ 
          success: true,
          skipped: true,
          reason: "No active subscription - trial period"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`[REPORT-USAGE] Subscription plan: ${subscription.plan || 'start'}`);
    console.log(`[REPORT-USAGE] Stripe customer ID: ${subscription.stripe_customer_id}`);

    // Parse request body
    const { quantity = 1 } = await req.json();

    // Use the new Billing Meter Events API
    // First, we need to get the meter ID for our usage tracking
    // For now, we'll track usage in the database and report via invoice item approach
    
    // Alternative approach: Create an invoice item for the metered usage
    // This is a simpler approach that works without the new meter system
    
    // Get the unit amount based on plan (in öre/cents)
    const planPricing: Record<string, number> = {
      start: 595,  // 5.95 SEK
      pro: 295,    // 2.95 SEK
      elit: 195,   // 1.95 SEK
    };
    
    const plan = subscription.plan || 'start';
    const unitAmount = planPricing[plan] || planPricing.start;
    
    console.log(`[REPORT-USAGE] Plan: ${plan}, unit amount: ${unitAmount} öre`);
    
    // Create invoice item for the usage with amount directly
    const invoiceItem = await stripe.invoiceItems.create({
      customer: subscription.stripe_customer_id,
      unit_amount: unitAmount,
      currency: 'sek',
      quantity: quantity,
      description: `AI bildredigering (${quantity} ${quantity === 1 ? 'bild' : 'bilder'})`,
    });

    console.log(`[REPORT-USAGE] Created invoice item for ${quantity} image(s):`, invoiceItem.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        invoiceItemId: invoiceItem.id,
        plan: plan,
        quantity: quantity
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
