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

// Fallback plan pricing (used only if Stripe data not available)
const FALLBACK_PLAN_PRICING = {
  start: {
    name: 'Start',
    monthlyFee: 349,
    pricePerImage: 5.95,
    color: 'green',
  },
  pro: {
    name: 'Pro',
    monthlyFee: 449,
    pricePerImage: 2.95,
    color: 'blue',
  },
  elit: {
    name: 'Elit',
    monthlyFee: 995,
    pricePerImage: 1.95,
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
      .select("*, plan, scheduled_plan, scheduled_plan_date")
      .eq("company_id", company.id)
      .in("status", ["active", "trialing", "canceled", "past_due"])
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Function to get dynamic pricing from Stripe subscription
    const getDynamicPricing = async (stripeSubscriptionId: string) => {
      try {
        console.log(`[BILLING-INFO] Fetching dynamic pricing from Stripe subscription: ${stripeSubscriptionId}`);
        const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
          expand: ['items.data.price'],
        });

        let monthlyFee = 0;
        let pricePerImage = 0;
        let planName = 'Anpassad';

        for (const item of stripeSubscription.items.data) {
          const price = item.price;
          
          if (price.recurring?.usage_type === 'metered') {
            // This is the per-image price
            pricePerImage = (price.unit_amount || 0) / 100;
            console.log(`[BILLING-INFO] Found metered price: ${pricePerImage} kr/image`);
          } else if (price.recurring?.usage_type === 'licensed') {
            // This is the fixed monthly fee
            monthlyFee = (price.unit_amount || 0) / 100;
            console.log(`[BILLING-INFO] Found licensed price: ${monthlyFee} kr/month`);
          }

          // Try to get plan name from price metadata or product
          if (price.metadata?.plan_name) {
            planName = price.metadata.plan_name;
          }
        }

        return {
          name: planName,
          monthlyFee,
          pricePerImage,
          color: 'primary',
        };
      } catch (error) {
        console.error("[BILLING-INFO] Error fetching Stripe subscription:", error);
        return null;
      }
    };

    // Get current plan config - try dynamic pricing first
    let currentPlan = subscription?.plan || null;
    let planConfig = null;

    // If we have a Stripe subscription, try to get dynamic pricing
    if (subscription?.stripe_subscription_id) {
      planConfig = await getDynamicPricing(subscription.stripe_subscription_id);
    }

    // If no dynamic pricing, try to get from Stripe customer metadata
    if (!planConfig && company.stripe_customer_id) {
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

    // Fallback to hardcoded pricing if no dynamic pricing available
    if (!planConfig) {
      currentPlan = currentPlan || 'start';
      planConfig = FALLBACK_PLAN_PRICING[currentPlan as keyof typeof FALLBACK_PLAN_PRICING] || FALLBACK_PLAN_PRICING.start;
    }

    // Check if there's an active subscription in database
    const hasActiveSubscription = !!(subscription && ["active", "trialing"].includes(subscription.status));

    if (!company.stripe_customer_id) {
      return new Response(
        JSON.stringify({
          hasCustomer: false,
          hasPaymentMethod: false,
          hasActiveSubscription,
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

    // Create per-user breakdown using stored costs
    const userUsageStats = (companyUsers || []).map((uc) => {
      const profile = profiles?.find((p) => p.id === uc.user_id);
      const stats = usageStats?.find((s) => s.user_id === uc.user_id);
      const editedImages = stats?.edited_images_count || 0;
      
      return {
        userId: uc.user_id,
        email: profile?.email || "Okänd användare",
        editedImages,
        cost: stats?.edited_images_cost || 0,
      };
    });

    // Calculate total company usage using stored costs
    const totalEditedImages = (usageStats || []).reduce(
      (acc, stat) => acc + stat.edited_images_count,
      0
    );
    const totalCost = (usageStats || []).reduce(
      (acc, stat) => acc + (stat.edited_images_cost || 0),
      0
    );
    
    const totalUsage = {
      editedImages: totalEditedImages,
      cost: totalCost,
    };

    // Check if user has payment method
    let hasPaymentMethod = false;
    if (company.stripe_customer_id) {
      try {
        console.log(`[BILLING-INFO] Checking payment methods for customer: ${company.stripe_customer_id}`);
        
        const paymentMethods = await stripe.paymentMethods.list({
          customer: company.stripe_customer_id,
          type: 'card',
          limit: 1,
        });
        
        hasPaymentMethod = paymentMethods.data.length > 0;
        
        console.log(`[BILLING-INFO] Payment methods found: ${paymentMethods.data.length}, hasPaymentMethod: ${hasPaymentMethod}`);
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
        hasActiveSubscription,
        isAdmin,
        plan: currentPlan,
        planConfig,
        subscription: subscription ? {
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          plan: subscription.plan,
          scheduled_plan: subscription.scheduled_plan,
          scheduled_plan_date: subscription.scheduled_plan_date,
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
