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

    // Update company with Stripe customer ID
    const { error: updateError } = await supabaseClient
      .from("companies")
      .update({ stripe_customer_id: customer.id })
      .eq("id", company.id);

    if (updateError) {
      console.error("Error updating company:", updateError);
      throw updateError;
    }

    console.log("Stripe customer created:", customer.id);

    return new Response(
      JSON.stringify({
        customerId: customer.id,
        message: "Customer created successfully",
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
