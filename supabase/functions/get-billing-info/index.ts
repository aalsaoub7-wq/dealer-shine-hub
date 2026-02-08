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

// Admin test account - special pricing for testing without Stripe
const ADMIN_TEST_COMPANY_ID = 'e0496e49-c30b-4fbd-a346-d8dfeacdf1ea';
const ADMIN_TEST_PRICING = {
  name: 'Test',
  monthlyFee: 0,
  pricePerImage: 3.2,
  color: 'primary',
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

    // Get user's company
    let { data: userCompany } = await supabaseClient
      .from("user_companies")
      .select("company_id, companies(id, name, stripe_customer_id)")
      .eq("user_id", user.id)
      .single();

    if (!userCompany?.companies) {
      // Self-healing: if trigger failed, try to create company from signup code
      console.log(`[BILLING-INFO] No company found for user ${user.id}, attempting self-healing...`);
      
      const { data: { user: adminUser } } = await supabaseClient.auth.admin.getUser(user.id);
      const signupCode = adminUser?.user_metadata?.signup_code;
      
      if (signupCode) {
        console.log(`[BILLING-INFO] Found signup_code in metadata: ${signupCode}`);
        
        const { data: codeRecord } = await supabaseClient
          .from("signup_codes")
          .select("id, stripe_customer_id, company_name")
          .eq("code", signupCode)
          .is("used_at", null)
          .maybeSingle();
        
        if (codeRecord) {
          console.log(`[BILLING-INFO] Found unused signup code, creating company for user ${user.id}`);
          
          // Create company
          const { data: newCompany, error: companyError } = await supabaseClient
            .from("companies")
            .insert({
              name: codeRecord.company_name || `Company - ${user.email}`,
              stripe_customer_id: codeRecord.stripe_customer_id,
              trial_end_date: null,
              trial_images_remaining: 0,
            })
            .select("id, name, stripe_customer_id")
            .single();
          
          if (companyError || !newCompany) {
            console.error("[BILLING-INFO] Self-healing: failed to create company", companyError);
            throw new Error("No company found for user");
          }
          
          // Link user to company
          await supabaseClient
            .from("user_companies")
            .insert({ user_id: user.id, company_id: newCompany.id });
          
          // Give admin role
          await supabaseClient
            .from("user_roles")
            .insert({ user_id: user.id, company_id: newCompany.id, role: "admin" });
          
          // Mark signup code as used
          await supabaseClient
            .from("signup_codes")
            .update({ used_at: new Date().toISOString(), used_by: user.id })
            .eq("id", codeRecord.id);
          
          // Remove lead entry
          await supabaseClient
            .from("leads")
            .delete()
            .eq("email", user.email || "");
          
          console.log(`[BILLING-INFO] Self-healing complete. Company ${newCompany.id} created for user ${user.id}`);
          
          // Re-assign so the rest of the function works
          userCompany = { company_id: newCompany.id, companies: newCompany } as any;
        } else {
          console.log("[BILLING-INFO] No unused signup code found, cannot self-heal");
          throw new Error("No company found for user");
        }
      } else {
        console.log("[BILLING-INFO] No signup_code in user metadata, cannot self-heal");
        throw new Error("No company found for user");
      }
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

    // Get subscription info from database
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("*")
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
        
        // Get included_images from subscription metadata
        const includedImages = parseInt(stripeSubscription.metadata?.included_images || "0");
        console.log(`[BILLING-INFO] Included images from metadata: ${includedImages}`);

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
          includedImages,
          color: 'primary',
        };
      } catch (error) {
        console.error("[BILLING-INFO] Error fetching Stripe subscription:", error);
        return null;
      }
    };

    // Get pricing - always from Stripe (no fallback to hardcoded plans)
    let planConfig = null;

    // Try to get subscription ID from database first, or fetch directly from Stripe
    let stripeSubscriptionId = subscription?.stripe_subscription_id;

    // Fallback: If no subscription in DB but customer exists in Stripe, fetch active subscription directly
    if (!stripeSubscriptionId && company.stripe_customer_id) {
      try {
        console.log(`[BILLING-INFO] No subscription in DB, fetching from Stripe for customer: ${company.stripe_customer_id}`);
        const stripeSubs = await stripe.subscriptions.list({
          customer: company.stripe_customer_id,
          status: 'active',
          limit: 1,
        });
        if (stripeSubs.data.length > 0) {
          stripeSubscriptionId = stripeSubs.data[0].id;
          console.log(`[BILLING-INFO] Found Stripe subscription: ${stripeSubscriptionId}`);
        }
      } catch (error) {
        console.error("[BILLING-INFO] Error fetching Stripe subscriptions:", error);
      }
    }

    // If we have a Stripe subscription ID, get dynamic pricing
    if (stripeSubscriptionId) {
      planConfig = await getDynamicPricing(stripeSubscriptionId);
    }

    // Special pricing for admin test account (bypasses Stripe)
    if (company.id === ADMIN_TEST_COMPANY_ID) {
      console.log('[BILLING-INFO] Using admin test pricing for company:', company.id);
      planConfig = ADMIN_TEST_PRICING;
    }

    // Default pricing if nothing found
    if (!planConfig) {
      planConfig = {
        name: 'Inget abonnemang',
        monthlyFee: 0,
        pricePerImage: 0,
        includedImages: 0,
        color: 'primary',
      };
    }

    // Check if there's an active subscription in database
    const hasActiveSubscription = !!(subscription && ["active", "trialing"].includes(subscription.status));

    if (!company.stripe_customer_id && company.id !== ADMIN_TEST_COMPANY_ID) {
      return new Response(
        JSON.stringify({
          hasCustomer: false,
          hasPaymentMethod: false,
          hasActiveSubscription,
          isAdmin,
          planConfig,
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
    let invoices: any = { data: [] };
    let portalSession: any = { url: null };

    // Skip Stripe API calls for admin test account (no Stripe customer)
    if (company.stripe_customer_id && company.id !== ADMIN_TEST_COMPANY_ID) {
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

      // Get invoices from Stripe
      try {
        invoices = await stripe.invoices.list({
          customer: company.stripe_customer_id,
          limit: 10,
        });
      } catch (error) {
        console.error("[BILLING-INFO] Error fetching invoices:", error);
      }

      // Get customer portal URL
      try {
        portalSession = await stripe.billingPortal.sessions.create({
          customer: company.stripe_customer_id,
          return_url: `${req.headers.get("origin") || "https://abepwxatllszoapfmccl.supabase.co"}/`,
        });
      } catch (error) {
        console.error("[BILLING-INFO] Error creating portal session:", error);
      }
    } else if (company.id === ADMIN_TEST_COMPANY_ID) {
      console.log('[BILLING-INFO] Admin test account - granting unlimited access');
      hasPaymentMethod = true; // Allow unlimited editing for admin test account
    }

    return new Response(
      JSON.stringify({
        hasCustomer: true,
        customerId: company.stripe_customer_id,
        hasPaymentMethod,
        hasActiveSubscription,
        isAdmin,
        planConfig,
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
