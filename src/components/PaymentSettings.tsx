import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "./ui/card";
import { PaymentSettingsSkeleton } from "./PaymentSettingsSkeleton";

interface BillingInfo {
  hasCustomer: boolean;
  customerId?: string;
  currentUsage?: {
    editedImages: number;
    cost: number;
  };
  invoices?: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: string;
    invoicePdf: string | null;
  }>;
  portalUrl?: string;
}

export const PaymentSettings = () => {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const { toast } = useToast();

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "get-billing-info"
      );

      if (error) throw error;
      setBillingInfo(data);
    } catch (error: any) {
      console.error("Error fetching billing info:", error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta faktureringsinformation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStripeCustomer = async () => {
    try {
      setCreatingCustomer(true);
      const { data, error } = await supabase.functions.invoke(
        "create-stripe-customer"
      );

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Stripe-kund skapad",
      });

      // Refresh billing info
      await fetchBillingInfo();
    } catch (error: any) {
      console.error("Error creating Stripe customer:", error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa Stripe-kund",
        variant: "destructive",
      });
    } finally {
      setCreatingCustomer(false);
    }
  };

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  if (loading) {
    return <PaymentSettingsSkeleton />;
  }

  if (!billingInfo?.hasCustomer) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Stripe-betalning är inte aktiverad ännu
              </p>
              <Button
                onClick={createStripeCustomer}
                disabled={creatingCustomer}
              >
                {creatingCustomer && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Aktivera Stripe-betalning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pricing */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Prissättning</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="text-sm">Redigerad bild</span>
              <span className="text-sm font-semibold">4,95 kr</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Usage */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Aktuell användning denna månad</h3>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Redigerade bilder
              </span>
              <span className="text-sm font-semibold">
                {billingInfo.currentUsage?.editedImages || 0} st
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Totalt att betala</span>
              <span className="text-lg font-bold">
                {(billingInfo.currentUsage?.cost || 0).toFixed(2)} kr
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manage Billing */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Hantera betalning</h3>
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={() => window.open(billingInfo.portalUrl, "_blank")}
              className="w-full"
            >
              Öppna Stripe-portal
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Hantera dina betalningsmetoder, se fakturor och uppdatera
              betalningsinformation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      {billingInfo.invoices && billingInfo.invoices.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Fakturahistorik</h3>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {billingInfo.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {new Date(invoice.created).toLocaleDateString("sv-SE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status:{" "}
                        {invoice.status === "paid" ? "Betald" : invoice.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {invoice.amount.toFixed(2)}{" "}
                        {invoice.currency.toUpperCase()}
                      </span>
                      {invoice.invoicePdf && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(invoice.invoicePdf!, "_blank")
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
