import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
      apiVersion: "2023-10-16",
    });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Ingen authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Kunde inte autentisera användare");
    }

    const userId = userData.user.id;

    console.log(`Deleting user account: ${userId}`);

    // Get user's company to find Stripe customer ID
    const { data: userCompany } = await supabaseAdmin
      .from("user_companies")
      .select("company_id, companies(stripe_customer_id)")
      .eq("user_id", userId)
      .single();

    // Cancel Stripe subscriptions if user has a company with Stripe customer
    if (userCompany?.companies) {
      const company = Array.isArray(userCompany.companies)
        ? userCompany.companies[0]
        : userCompany.companies;
      
      if (company?.stripe_customer_id) {
        console.log(`Found Stripe customer: ${company.stripe_customer_id}`);
        
        try {
          // Get all active subscriptions for this customer
          const subscriptions = await stripe.subscriptions.list({
            customer: company.stripe_customer_id,
            status: "active",
          });

          // Also get trialing subscriptions
          const trialingSubscriptions = await stripe.subscriptions.list({
            customer: company.stripe_customer_id,
            status: "trialing",
          });

          const allSubscriptions = [...subscriptions.data, ...trialingSubscriptions.data];

          // Cancel each subscription
          for (const sub of allSubscriptions) {
            console.log(`Canceling Stripe subscription: ${sub.id}`);
            await stripe.subscriptions.cancel(sub.id);
            console.log(`Successfully canceled subscription: ${sub.id}`);
          }

          if (allSubscriptions.length === 0) {
            console.log("No active subscriptions found to cancel");
          }
        } catch (stripeError: any) {
          console.error("Error canceling Stripe subscriptions:", stripeError);
          // Continue with account deletion even if Stripe cancellation fails
        }
      }
    }

    // Delete user via Admin API - this will cascade through foreign keys
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error("Delete error:", deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
