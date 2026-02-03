import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "aalsaoub7@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    if (userData.user.email !== ADMIN_EMAIL) {
      throw new Error("Admin access required");
    }

    // Fetch companies
    const { data: companies, error: companiesError } = await supabaseClient
      .from("companies")
      .select("id, name, stripe_customer_id, created_at")
      .order("created_at", { ascending: false });

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`);
    }

    // Fetch ALL signup codes (including pending)
    const { data: signupCodes, error: codesError } = await supabaseClient
      .from("signup_codes")
      .select("stripe_customer_id, code, company_name, created_at, checkout_url");

    if (codesError) {
      throw new Error(`Failed to fetch signup codes: ${codesError.message}`);
    }

    // Create map of stripe_customer_id to signup code data
    const codeMap: Record<string, { code: string; checkout_url: string | null }> = {};
    const pendingCodes: Array<{ code: string; company_name: string | null; created_at: string | null; checkout_url: string | null }> = [];
    
    for (const sc of signupCodes || []) {
      if (sc.stripe_customer_id === "pending") {
        // This is a pending customer (checkout link created but not yet registered)
        pendingCodes.push({
          code: sc.code,
          company_name: sc.company_name,
          created_at: sc.created_at,
          checkout_url: sc.checkout_url
        });
      } else if (sc.stripe_customer_id) {
        codeMap[sc.stripe_customer_id] = {
          code: sc.code,
          checkout_url: sc.checkout_url
        };
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Build customer list with pricing from Stripe (active customers)
    const activeCustomers = await Promise.all(
      (companies || []).map(async (company) => {
        let monthlyFee: number | null = null;
        let pricePerImage: number | null = null;

        if (company.stripe_customer_id) {
          try {
            const subscriptions = await stripe.subscriptions.list({
              customer: company.stripe_customer_id,
              status: "active",
              limit: 1,
            });

            if (subscriptions.data.length > 0) {
              const sub = subscriptions.data[0];
              for (const item of sub.items.data) {
                const price = item.price;
                
                // Metered price (per image)
                if (price.recurring?.usage_type === "metered") {
                  pricePerImage = (price.unit_amount || 0) / 100;
                }
                // Fixed monthly fee
                else if (price.type === "recurring") {
                  monthlyFee = (price.unit_amount || 0) / 100;
                }
              }
            }
          } catch (stripeError) {
            console.error(`Stripe error for ${company.id}:`, stripeError);
          }
        }

        const codeData = company.stripe_customer_id ? codeMap[company.stripe_customer_id] : null;

        return {
          id: company.id,
          name: company.name,
          stripe_customer_id: company.stripe_customer_id,
          signup_code: codeData?.code || null,
          checkout_url: codeData?.checkout_url || null,
          status: "active" as const,
          created_at: company.created_at,
          monthlyFee,
          pricePerImage,
        };
      })
    );

    // Build pending customers list
    const pendingCustomers = pendingCodes.map((pc) => ({
      id: `pending-${pc.code}`,
      name: pc.company_name || "Okänt företag",
      stripe_customer_id: null,
      signup_code: pc.code,
      checkout_url: pc.checkout_url,
      status: "pending" as const,
      created_at: pc.created_at || new Date().toISOString(),
      monthlyFee: null,
      pricePerImage: null,
    }));

    // Combine and return
    const customers = [...activeCustomers, ...pendingCustomers];

    return new Response(JSON.stringify({ customers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-admin-customers:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
