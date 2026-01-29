import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Webhook event:", event.type);

    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription created:", subscription.id, "Customer:", subscription.customer);

        // Find company based on Stripe customer ID
        const { data: company, error: companyError } = await supabaseClient
          .from("companies")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (companyError || !company) {
          console.error("Could not find company for customer:", subscription.customer);
          break;
        }

        // Insert new subscription row (no plan column needed - all pricing from Stripe)
        const { error: insertError } = await supabaseClient
          .from("subscriptions")
          .insert({
            company_id: company.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });

        if (insertError) {
          console.error("Error inserting subscription:", insertError);
        } else {
          console.log("Subscription inserted for company:", company.id);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment succeeded for invoice:", invoice.id);

        // Update usage_stats with the invoice ID
        const { error } = await supabaseClient
          .from("usage_stats")
          .update({ stripe_invoice_id: invoice.id })
          .eq("stripe_invoice_id", null)
          .is("stripe_invoice_id", null);

        if (error) {
          console.error("Error updating usage_stats:", error);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment failed for invoice:", invoice.id, "Customer:", invoice.customer);

        // Find subscription for this customer and mark payment as failed
        if (invoice.subscription) {
          const { error: updateError } = await supabaseClient
            .from("subscriptions")
            .update({ 
              status: "past_due",
              updated_at: new Date().toISOString()
            })
            .eq("stripe_subscription_id", invoice.subscription as string);

          if (updateError) {
            console.error("Error updating subscription to past_due:", updateError);
          } else {
            console.log("Subscription marked as past_due:", invoice.subscription);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id);

        // Sync status and period dates from Stripe
        const { error } = await supabaseClient
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscription.id);

        // Update subscription status
        const { error } = await supabaseClient
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);
        
        // Only process subscription checkouts
        if (session.mode !== "subscription") {
          console.log("Not a subscription checkout, skipping");
          break;
        }

        const customerId = session.customer as string;
        const companyName = session.metadata?.company_name || "Okänt företag";
        const signupCode = session.metadata?.signup_code;
        
        console.log("Processing checkout for customer:", customerId, "Company:", companyName, "SignupCode:", signupCode);

        if (signupCode) {
          // UPDATE existing signup code with real Stripe customer ID
          const { error: updateError } = await supabaseClient
            .from("signup_codes")
            .update({ stripe_customer_id: customerId })
            .eq("code", signupCode)
            .eq("stripe_customer_id", "pending");

          if (updateError) {
            console.error("Error updating signup code:", updateError);
          } else {
            console.log("Signup code updated with customer:", signupCode, customerId);
          }
        } else {
          // Fallback: create new code (for legacy checkouts without code in metadata)
          console.log("No signup_code in metadata, creating new code");
          
          const prefix = companyName
            .substring(0, 6)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .padEnd(3, "X")
            .substring(0, 6);
          const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
          const newSignupCode = `${prefix}-${suffix}`;

          const { error: insertError } = await supabaseClient
            .from("signup_codes")
            .insert({
              code: newSignupCode,
              stripe_customer_id: customerId,
              company_name: companyName,
            });

          if (insertError) {
            console.error("Error creating signup code:", insertError);
          } else {
            console.log("Signup code created:", newSignupCode, "for customer:", customerId);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
