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
    console.log(`[REPORT-USAGE] Stripe customer ID: ${subscription.stripe_customer_id}`);

    // Parse request body
    const { quantity = 1 } = await req.json();

    // Use the new Billing Meter Events API
    // First, we need to get the meter ID for our usage tracking
    // For now, we'll track usage in the database and report via invoice item approach
    
    // Alternative approach: Create an invoice item for the metered usage
    // This is a simpler approach that works without the new meter system
    
    // Get the metered price based on plan
    const meteredPriceIds: Record<string, string> = {
      start: 'price_1SaGraRrATtOsqxE9qIFXSax',
      pro: 'price_1SaGsbRrATtOsqxEj14M7j1A',
      elit: 'price_1SaGsvRrATtOsqxEtH1fjQmG',
    };
    
    const plan = subscription.plan || 'start';
    const priceId = meteredPriceIds[plan] || meteredPriceIds.start;
    
    console.log(`[REPORT-USAGE] Using price ID: ${priceId} for plan: ${plan}`);
    
    // Get price details to calculate amount
    const price = await stripe.prices.retrieve(priceId);
    const unitAmount = price.unit_amount || 495; // Default to 4.95 SEK in öre
    
    // Create invoice item for the usage
    const invoiceItem = await stripe.invoiceItems.create({
      customer: subscription.stripe_customer_id,
      price: priceId,
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
