import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Existing meter ID for usage-based billing
const METER_ID = "mtr_61TnkILkBinJoW0aN41RrATtOsqxENd2";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CREATE-CUSTOMER-CHECKOUT] Function started");

    // Verify admin user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    // Hardcoded admin check
    if (userData.user.email !== "aalsaoub7@gmail.com") {
      throw new Error("Access denied");
    }

    console.log("[CREATE-CUSTOMER-CHECKOUT] Admin verified:", userData.user.email);

    // Parse request body
    const { companyName, monthlyFee, pricePerImage } = await req.json();

    if (!companyName || !monthlyFee || !pricePerImage) {
      throw new Error("Missing required fields: companyName, monthlyFee, pricePerImage");
    }

    console.log("[CREATE-CUSTOMER-CHECKOUT] Creating for:", companyName, "Monthly:", monthlyFee, "Per image:", pricePerImage);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase admin client for signup_codes table
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate signup code BEFORE checkout session
    const prefix = companyName
      .substring(0, 6)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .padEnd(3, "X")
      .substring(0, 6);
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const signupCode = `${prefix}-${suffix}`;

    console.log("[CREATE-CUSTOMER-CHECKOUT] Generated signup code:", signupCode);

    // Insert signup code with pending status (will be updated by webhook)
    const { error: signupError } = await supabaseAdmin.from("signup_codes").insert({
      code: signupCode,
      stripe_customer_id: "pending",
      company_name: companyName,
    });

    if (signupError) {
      console.error("[CREATE-CUSTOMER-CHECKOUT] Error creating signup code:", signupError);
      throw new Error("Failed to create signup code");
    }

    // Step 1: Create Product
    const product = await stripe.products.create({
      name: `Luvero x ${companyName}`,
      metadata: {
        company_name: companyName,
      },
    });
    console.log("[CREATE-CUSTOMER-CHECKOUT] Product created:", product.id);

    // Step 2: Create Monthly Price (licensed/flat fee)
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: monthlyFee, // Already in öre
      currency: "sek",
      recurring: {
        interval: "month",
      },
      nickname: `${companyName} - Månadsavgift`,
    });
    console.log("[CREATE-CUSTOMER-CHECKOUT] Monthly price created:", monthlyPrice.id);

    // Step 3: Create Metered Price (per image)
    const meteredPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: pricePerImage, // Already in öre
      currency: "sek",
      recurring: {
        interval: "month",
        usage_type: "metered",
        meter: METER_ID,
      },
      nickname: `${companyName} - Per bild`,
    });
    console.log("[CREATE-CUSTOMER-CHECKOUT] Metered price created:", meteredPrice.id);

    // Step 4: Create Checkout Session with signup_code in metadata
    const origin = req.headers.get("origin") || "https://luvero.se";
    
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: monthlyPrice.id,
          quantity: 1,
        },
        {
          price: meteredPrice.id,
        },
      ],
      metadata: {
        company_name: companyName,
        product_id: product.id,
        signup_code: signupCode, // Include signup code for webhook to update
      },
      subscription_data: {
        metadata: {
          company_name: companyName,
          product_id: product.id,
        },
      },
      success_url: `${origin}/auth?mode=signup&checkout_success=true`,
      cancel_url: `${origin}`,
    });

    console.log("[CREATE-CUSTOMER-CHECKOUT] Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, signupCode }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[CREATE-CUSTOMER-CHECKOUT] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
