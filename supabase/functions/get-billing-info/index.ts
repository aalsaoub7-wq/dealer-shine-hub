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

// Plan pricing configuration
const PLAN_PRICING = {
  start: {
    name: 'Start',
    monthlyFee: 239,
    pricePerImage: 4.95,
    color: 'green',
  },
  pro: {
    name: 'Pro',
    monthlyFee: 449,
    pricePerImage: 1.95,
    color: 'blue',
  },
  elit: {
    name: 'Elit',
    monthlyFee: 995,
    pricePerImage: 0.99,
    color: 'purple',
  },
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

    // Check if user is admin
    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", company.id)
      .maybeSingle();
    
    const isAdmin = userRole?.role === "admin";

    // Calculate trial status
    const now = new Date();
    const trialEndDate = company.trial_end_date 
      ? new Date(company.trial_end_date) 
      : null;
    const isInTrial = trialEndDate ? now < trialEndDate : false;
    const daysLeftInTrial = trialEndDate 
      ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    // Get subscription info including plan
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("*, plan")
      .eq("company_id", company.id)
      .eq("status", "active")
      .maybeSingle();

    // Get current plan - check subscription first, then Stripe customer metadata as fallback
    let currentPlan = subscription?.plan || null;
    
    // If no plan from subscription, try to get from Stripe customer metadata
    if (!currentPlan && company.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(company.stripe_customer_id) as any;
        if (customer && !customer.deleted && customer.metadata?.plan) {
          currentPlan = customer.metadata.plan;
          console.log(`[BILLING-INFO] Got plan from Stripe metadata: ${currentPlan}`);
        }
      } catch (error) {
        console.error("[BILLING-INFO] Error fetching customer metadata:", error);
      }
    }
    
    // Default to 'start' if still no plan
    currentPlan = currentPlan || 'start';
    const planConfig = PLAN_PRICING[currentPlan as keyof typeof PLAN_PRICING] || PLAN_PRICING.start;

    if (!company.stripe_customer_id) {
      return new Response(
        JSON.stringify({
          hasCustomer: false,
          hasPaymentMethod: false,
          isAdmin,
          plan: currentPlan,
          planConfig,
          trial: {
            isInTrial,
            daysLeft: daysLeftInTrial,
            endDate: trialEndDate?.toISOString(),
          imagesRemaining: Math.min(company.trial_images_remaining || 0, 50),
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

    // Create per-user breakdown with plan-specific pricing
    const userUsageStats = (companyUsers || []).map((uc) => {
      const profile = profiles?.find((p) => p.id === uc.user_id);
      const stats = usageStats?.find((s) => s.user_id === uc.user_id);
      const editedImages = stats?.edited_images_count || 0;
      
      return {
        userId: uc.user_id,
        email: profile?.email || "Okänd användare",
        editedImages,
        cost: editedImages * planConfig.pricePerImage,
      };
    });

    // Calculate total company usage with plan-specific pricing
    const totalEditedImages = (usageStats || []).reduce(
      (acc, stat) => acc + stat.edited_images_count,
      0
    );
    
    const totalUsage = {
      editedImages: totalEditedImages,
      cost: totalEditedImages * planConfig.pricePerImage,
    };

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
        isAdmin,
        plan: currentPlan,
        planConfig,
        subscription: subscription ? {
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          plan: subscription.plan,
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
          imagesRemaining: Math.min(company.trial_images_remaining || 0, 50),
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
