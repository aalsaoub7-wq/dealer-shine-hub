import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Loader2, ExternalLink, Image, TrendingUp, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { PaymentSettingsSkeleton } from "./PaymentSettingsSkeleton";
import { PRICES } from "@/lib/usageTracking";

interface BillingInfo {
  hasCustomer: boolean;
  customerId?: string;
  hasPaymentMethod?: boolean;
  subscription?: {
    status: string;
    current_period_end?: string;
  };
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
  const [openingPortal, setOpeningPortal] = useState(false);
  const [userUsageStats, setUserUsageStats] = useState<Array<{
    userId: string;
    email: string;
    editedImages: number;
    cost: number;
  }>>([]);
  const [totalUsage, setTotalUsage] = useState({ editedImages: 0, cost: 0 });
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const { data: userRole } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      return data?.role;
    },
  });

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      
      // Fetch billing info from edge function
      const { data, error } = await supabase.functions.invoke(
        "get-billing-info"
      );

      if (error) throw error;
      setBillingInfo(data);

      // Use user usage stats from edge function
      if (data.userUsageStats) {
        setUserUsageStats(data.userUsageStats);
        
        // Calculate totals
        const total = data.userUsageStats.reduce(
          (acc: any, stat: any) => ({
            editedImages: acc.editedImages + stat.editedImages,
            cost: acc.cost + stat.cost,
          }),
          { editedImages: 0, cost: 0 }
        );
        setTotalUsage(total);
      }
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

  const openCustomerPortal = async () => {
    try {
      setOpeningPortal(true);
      const { data, error } = await supabase.functions.invoke(
        "customer-portal"
      );

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        
        // Start polling every 30 seconds to check for payment method updates
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        console.log("[PAYMENT-SETTINGS] Starting polling for payment method updates");
        pollingIntervalRef.current = setInterval(() => {
          console.log("[PAYMENT-SETTINGS] Polling for billing info update");
          fetchBillingInfo();
        }, 30000); // 30 seconds
        
        // Stop polling after 10 minutes (20 polls)
        setTimeout(() => {
          if (pollingIntervalRef.current) {
            console.log("[PAYMENT-SETTINGS] Stopping polling after timeout");
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }, 600000); // 10 minutes
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Fel",
        description: "Kunde inte öppna Stripe-portal",
        variant: "destructive",
      });
    } finally {
      setOpeningPortal(false);
    }
  };

  useEffect(() => {
    fetchBillingInfo();
    
    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  if (userRole !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Åtkomst nekad</CardTitle>
          <CardDescription>
            Endast administratörer kan hantera betalningsinställningar.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
      {/* Payment Method Status */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Betalmetodstatus</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                billingInfo.hasPaymentMethod
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {billingInfo.hasPaymentMethod
                    ? 'Betalmetod tillagd' 
                    : 'Ingen betalmetod'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {billingInfo.hasPaymentMethod
                    ? 'Du kan redigera bilder'
                    : 'Lägg till betalmetod via Stripe-portalen för att redigera bilder'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Dashboard */}
      <Card className="animate-fade-in border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Månatlig användning - {new Date().toLocaleDateString("sv-SE", { month: "long", year: "numeric" })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base text-muted-foreground">Totalt:</span>
              <span className="text-lg md:text-2xl font-bold text-primary">
                {totalUsage.cost.toFixed(2)} kr
              </span>
            </div>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Översikt över företagets användning och kostnader per användare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userUsageStats.map((userStat) => (
            <div
              key={userStat.userId}
              className="flex flex-col gap-3 p-4 rounded-lg bg-gradient-to-br from-primary/5 via-transparent to-transparent border border-primary/10"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{userStat.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Redigerade bilder:</span>
                </div>
                <span className="text-lg font-bold text-foreground">{userStat.editedImages}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="text-sm font-medium text-muted-foreground">Kostnad:</span>
                <span className="text-base font-semibold text-foreground">
                  {userStat.cost.toFixed(2)} kr
                </span>
              </div>
            </div>
          ))}
          {userUsageStats.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Ingen användning denna månad
            </div>
          )}
          <div className="flex justify-between items-center pt-4 border-t-2 border-primary/20">
            <span className="text-base font-semibold">TOTAL</span>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm text-muted-foreground">
                {totalUsage.editedImages} bilder
              </span>
              <span className="text-xl font-bold text-primary">
                {totalUsage.cost.toFixed(2)} kr
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manage Billing */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Hantera betalning</h3>
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={openCustomerPortal}
              disabled={openingPortal}
              className="w-full"
            >
              {openingPortal && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
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
