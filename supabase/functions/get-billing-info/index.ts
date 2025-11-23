import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2025-08-27.basil",
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
    // Create client with service role key to bypass RLS and access all company data
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Still get authenticated user from the request
    const authClient = createClient(
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
    } = await authClient.auth.getUser();

    if (!user) {
      throw new Error("No user found");
    }

    // Get user's company with trial_end_date and trial image limits
    const { data: userCompany } = await supabaseClient
      .from("user_companies")
      .select("company_id, companies(id, name, stripe_customer_id, trial_end_date, trial_images_remaining, trial_images_used)")
      .eq("user_id", user.id)
      .single();

    if (!userCompany?.companies) {
      throw new Error("No company found for user");
    }

    const company = Array.isArray(userCompany.companies)
      ? userCompany.companies[0]
      : userCompany.companies;

    // Calculate trial status
    const now = new Date();
    const trialEndDate = company.trial_end_date 
      ? new Date(company.trial_end_date) 
      : null;
    const isInTrial = trialEndDate ? now < trialEndDate : false;
    const daysLeftInTrial = trialEndDate 
      ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    if (!company.stripe_customer_id) {
      return new Response(
        JSON.stringify({
          hasCustomer: false,
          hasPaymentMethod: false,
          trial: {
            isInTrial,
            daysLeft: daysLeftInTrial,
            endDate: trialEndDate?.toISOString(),
            imagesRemaining: company.trial_images_remaining || 0,
            imagesUsed: company.trial_images_used || 0,
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get current month usage for all company users
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const monthNumber = currentDate.getMonth(); // 0-11
    const firstDayOfMonth = `${year}-${String(monthNumber + 1).padStart(2, '0')}-01`;

    // Get all users in the company
    const { data: companyUsers } = await supabaseClient
      .from("user_companies")
      .select("user_id")
      .eq("company_id", company.id);

    const userIds = companyUsers?.map((uc) => uc.user_id) || [];

    // Get usage stats for all company users
    const { data: usageStats } = await supabaseClient
      .from("usage_stats")
      .select("*")
      .in("user_id", userIds)
      .eq("month", firstDayOfMonth);

    // Get profiles for all company users
    const { data: profiles } = await supabaseClient
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    // Create per-user breakdown
    const userUsageStats = (companyUsers || []).map((uc) => {
      const profile = profiles?.find((p) => p.id === uc.user_id);
      const stats = usageStats?.find((s) => s.user_id === uc.user_id);
      
      return {
        userId: uc.user_id,
        email: profile?.email || "Okänd användare",
        editedImages: stats?.edited_images_count || 0,
        cost: stats?.edited_images_cost || 0,
      };
    });

    // Calculate total company usage (excluding monthly fee here - added in frontend)
    const totalUsage = (usageStats || []).reduce(
      (acc, stat) => ({
        editedImages: acc.editedImages + stat.edited_images_count,
        cost: acc.cost + stat.edited_images_cost,
      }),
      { editedImages: 0, cost: 0 }
    );
    
    // Note: Monthly fee (239 kr) is added in the frontend PaymentSettings component

    // Get subscription info
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("company_id", company.id)
      .eq("status", "active")
      .maybeSingle();

    // Check if user has payment method by retrieving customer from Stripe
    let hasPaymentMethod = false;
    if (company.stripe_customer_id) {
      try {
        console.log(`[BILLING-INFO] Checking payment method for customer: ${company.stripe_customer_id}`);
        
        // Retrieve full customer object from Stripe
        const customer = await stripe.customers.retrieve(company.stripe_customer_id) as any;
        
        console.log(`[BILLING-INFO] Customer retrieved:`, {
          id: customer.id,
          email: customer.email,
          default_source: customer.default_source,
          invoice_settings_default_payment_method: customer.invoice_settings?.default_payment_method,
        });
        
        // Check multiple sources for payment method
        hasPaymentMethod = !!(
          customer.invoice_settings?.default_payment_method ||
          customer.default_source ||
          (subscription && subscription.default_payment_method)
        );
        
        console.log(`[BILLING-INFO] Payment method status: ${hasPaymentMethod}`);
        
        if (subscription) {
          console.log(`[BILLING-INFO] Subscription default_payment_method: ${subscription.default_payment_method}`);
        }
      } catch (error) {
        console.error("[BILLING-INFO] Error checking payment methods:", error);
      }
    }

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: company.stripe_customer_id,
      limit: 10,
    });

    // Get customer portal URL
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${req.headers.get("origin") || "https://abepwxatllszoapfmccl.supabase.co"}/`,
    });

    return new Response(
      JSON.stringify({
        hasCustomer: true,
        customerId: company.stripe_customer_id,
        hasPaymentMethod,
        subscription: subscription ? {
          status: subscription.status,
          current_period_end: subscription.current_period_end,
        } : undefined,
        currentUsage: totalUsage,
        userUsageStats: userUsageStats,
        invoices: invoices.data.map((inv: any) => ({
          id: inv.id,
          created: inv.created,
          amount: inv.amount_paid / 100,
          currency: inv.currency,
          status: inv.status,
          invoicePdf: inv.invoice_pdf,
        })),
        portalUrl: portalSession.url,
        trial: {
          isInTrial,
          daysLeft: daysLeftInTrial,
          endDate: trialEndDate?.toISOString(),
          imagesRemaining: company.trial_images_remaining || 0,
          imagesUsed: company.trial_images_used || 0,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in get-billing-info:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
