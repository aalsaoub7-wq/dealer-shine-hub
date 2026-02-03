import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

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

    // Get user's company with Stripe customer ID
    const { data: userCompany } = await supabaseClient
      .from("user_companies")
      .select("company_id, companies(id, stripe_customer_id)")
      .eq("user_id", user.id)
      .single();

    if (!userCompany?.companies) {
      throw new Error("No company found for user");
    }

    const company = Array.isArray(userCompany.companies)
      ? userCompany.companies[0]
      : userCompany.companies;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
      apiVersion: "2023-10-16",
    });

    let customerId = company.stripe_customer_id;

    // If no Stripe customer exists, create one
    if (!customerId) {
      console.log("No Stripe customer found, creating one...");
      
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          company_id: company.id,
        },
      });
      
      customerId = customer.id;
      console.log("Created Stripe customer:", customerId);

      // Save the customer ID to the company using service role
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseAdmin
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", company.id);
    }

    // Check if customer has active subscription with binding period
    let canCancel = true;
    let bindingEndDateStr: string | null = null;

    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        bindingEndDateStr = sub.metadata?.binding_end_date || null;

        if (bindingEndDateStr) {
          const bindingEndDate = new Date(bindingEndDateStr);
          const today = new Date();
          canCancel = bindingEndDate <= today;
          console.log("[CUSTOMER-PORTAL] Binding end date:", bindingEndDateStr, "Can cancel:", canCancel);
        }
      }
    } catch (subError) {
      console.error("[CUSTOMER-PORTAL] Error checking subscription:", subError);
      // Default to allowing cancellation if we can't check
      canCancel = true;
    }

    const origin = req.headers.get("origin") || "https://luvero.se";

    // Create dynamic portal configuration based on binding period
    let portalConfigId: string | undefined;

    try {
      const portalConfig = await stripe.billingPortal.configurations.create({
        features: {
          subscription_cancel: {
            enabled: canCancel,
            mode: "at_period_end",
          },
          payment_method_update: {
            enabled: true,
          },
          invoice_history: {
            enabled: true,
          },
        },
        business_profile: {
          headline: canCancel
            ? "Hantera din prenumeration"
            : `Bindningstid t.o.m. ${bindingEndDateStr}`,
        },
      });
      portalConfigId = portalConfig.id;
      console.log("[CUSTOMER-PORTAL] Created portal config:", portalConfigId, "canCancel:", canCancel);
    } catch (configError) {
      console.error("[CUSTOMER-PORTAL] Error creating portal config:", configError);
      // Continue without custom config - will use default
    }

    const portalSessionParams: Stripe.BillingPortal.SessionCreateParams = {
      customer: customerId,
      return_url: `${origin}/`,
    };

    if (portalConfigId) {
      portalSessionParams.configuration = portalConfigId;
    }

    const portalSession = await stripe.billingPortal.sessions.create(portalSessionParams);

    console.log("Customer portal session created:", portalSession.id);

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in customer-portal:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
