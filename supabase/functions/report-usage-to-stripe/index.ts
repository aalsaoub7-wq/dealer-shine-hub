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
    console.log(`[REPORT-USAGE] Function invoked at ${new Date().toISOString()}`);
    
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
      .select("company_id, companies(id, stripe_customer_id)")
      .eq("user_id", user.id)
      .single();

    if (companyError || !userCompany) {
      throw new Error("Company not found");
    }

    const company = Array.isArray(userCompany.companies)
      ? userCompany.companies[0]
      : userCompany.companies;

    // Admin test account - skip Stripe usage reporting entirely
    const ADMIN_TEST_COMPANY_ID = 'e0496e49-c30b-4fbd-a346-d8dfeacdf1ea';
    
    if (company.id === ADMIN_TEST_COMPANY_ID) {
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

    if (!company.stripe_customer_id) {
      console.log("[REPORT-USAGE] No Stripe customer ID - skipping usage reporting");
      return new Response(
        JSON.stringify({ 
          success: true,
          skipped: true,
          reason: "No Stripe customer ID"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get active subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: company.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      console.log("[REPORT-USAGE] No active subscription found - user likely in trial period");
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

    const subscription = subscriptions.data[0];
    console.log(`[REPORT-USAGE] Found subscription: ${subscription.id}`);

    // Check if customer has included images
    const includedImages = parseInt(subscription.metadata?.included_images || "0");
    console.log(`[REPORT-USAGE] Included images from metadata: ${includedImages}`);

    if (includedImages > 0) {
      // Calculate total usage for the company this month
      const currentDate = new Date();
      const firstDayOfMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
      
      // Get all users in the company
      const { data: companyUsers } = await supabase
        .from("user_companies")
        .select("user_id")
        .eq("company_id", userCompany.company_id);
      
      const userIds = (companyUsers || []).map(u => u.user_id);
      
      // Get total usage for the company this month
      const { data: usageStats } = await supabase
        .from("usage_stats")
        .select("edited_images_count")
        .in("user_id", userIds)
        .eq("month", firstDayOfMonth);
      
      const totalUsedThisMonth = (usageStats || []).reduce((sum, s) => sum + (s.edited_images_count || 0), 0);
      
      // If within included limit, skip Stripe reporting
      if (totalUsedThisMonth <= includedImages) {
        console.log(`[REPORT-USAGE] Image ${totalUsedThisMonth}/${includedImages} - within included limit, skipping Stripe`);
        return new Response(
          JSON.stringify({ 
            success: true,
            skipped: true,
            reason: `Within included images (${totalUsedThisMonth}/${includedImages})`
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      console.log(`[REPORT-USAGE] Image ${totalUsedThisMonth}/${includedImages} - OVER limit, reporting to Stripe`);
    }

    // Parse request body
    const { quantity = 1 } = await req.json();

    // Find the metered subscription item
    const meteredItem = subscription.items.data.find((item: any) => 
      item.price.recurring?.usage_type === 'metered'
    );

    if (!meteredItem) {
      console.error("[REPORT-USAGE] No metered price found in subscription");
      throw new Error("No metered price found in subscription");
    }

    console.log(`[REPORT-USAGE] Found metered item: ${meteredItem.id}, price: ${meteredItem.price.id}`);

    // Get the meter ID from the price
    const meterId = (meteredItem.price.recurring as any)?.meter;

    if (meterId) {
      // Use Billing Meter Events API (new method)
      console.log(`[REPORT-USAGE] Using Meter Events API with meter: ${meterId}`);
      
      try {
        // Get meter details to find event_name
        const meter = await stripe.billing.meters.retrieve(meterId);
        const eventName = meter.event_name;
        
        console.log(`[REPORT-USAGE] Meter event name: ${eventName}`);
        
        // Create meter event
        const meterEvent = await stripe.billing.meterEvents.create({
          event_name: eventName,
          payload: {
            value: String(quantity),
            stripe_customer_id: company.stripe_customer_id,
          },
          timestamp: Math.floor(Date.now() / 1000),
        });

        console.log(`[REPORT-USAGE] SUCCESS: Meter event created for customer ${company.stripe_customer_id}, identifier: ${meterEvent.identifier}, quantity: ${quantity}`);

        return new Response(
          JSON.stringify({ 
            success: true,
            method: "meter_event",
            meterEventId: meterEvent.identifier,
            quantity: quantity
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (meterError: any) {
        console.error(`[REPORT-USAGE] FAILED: Meter Events API error for customer ${company.stripe_customer_id}: ${meterError.message}`);
        // Fall through to usage record method
      }
    }

    // Fallback: Use Usage Records API (legacy metered billing)
    console.log(`[REPORT-USAGE] Using Usage Records API as fallback`);
    
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      meteredItem.id,
      {
        quantity: quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      }
    );

    console.log(`[REPORT-USAGE] Created usage record: ${usageRecord.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        method: "usage_record",
        usageRecordId: usageRecord.id,
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
