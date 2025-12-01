import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import {
  Loader2,
  ExternalLink,
  Image,
  TrendingUp,
  User,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { PaymentSettingsSkeleton } from "./PaymentSettingsSkeleton";
import { PRICES } from "@/lib/usageTracking";
import { openExternalUrl } from "@/lib/nativeCapabilities";
import { isNativeApp } from "@/lib/utils";
interface BillingInfo {
  hasCustomer: boolean;
  customerId?: string;
  hasPaymentMethod?: boolean;
  trial?: {
    isInTrial: boolean;
    daysLeft: number;
    endDate: string;
  };
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
  const [userUsageStats, setUserUsageStats] = useState<
    Array<{
      userId: string;
      email: string;
      editedImages: number;
      cost: number;
    }>
  >([]);
  const [totalUsage, setTotalUsage] = useState({
    editedImages: 0,
    cost: 0,
  });
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { data: userRole } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
      return data?.role;
    },
  });
  const fetchBillingInfo = async () => {
    try {
      setLoading(true);

      // Fetch billing info from edge function
      const { data, error } = await supabase.functions.invoke("get-billing-info");
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
          {
            editedImages: 0,
            cost: 0,
          },
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
      const { data, error } = await supabase.functions.invoke("create-stripe-customer");
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
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        await openExternalUrl(data.url);

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
          <CardDescription>Endast administratörer kan hantera betalningsinställningar.</CardDescription>
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
              <p className="text-sm text-muted-foreground">Stripe-betalning är inte aktiverad ännu</p>
              <Button onClick={createStripeCustomer} disabled={creatingCustomer}>
                {creatingCustomer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
      {/* Trial Status */}
      {billingInfo?.trial?.isInTrial && (
        <Card className="border-primary/20 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Testperiod Aktiv
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                Du har <strong>{billingInfo.trial.daysLeft} dagar</strong> kvar av din gratisperiod
              </p>
              <p className="text-xs text-muted-foreground">
                Testperiod löper ut: {new Date(billingInfo.trial.endDate).toLocaleDateString("sv-SE")}
              </p>
              {!billingInfo.hasPaymentMethod && (
                <p className="text-xs text-amber-400 mt-2">
                  Lägg till en betalmetod innan din testperiod löper ut för att fortsätta använda AI-redigering
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!billingInfo?.trial?.isInTrial && billingInfo?.trial?.daysLeft === 0 && !billingInfo?.hasPaymentMethod && (
        <Card className="border-destructive/20 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Testperiod Löpt Ut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">
              Din testperiod har löpt ut. Lägg till en betalmetod för att fortsätta använda AI-redigering.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Status */}
      <Card className={billingInfo?.hasPaymentMethod ? "border-primary/20 bg-card" : "border-amber-500/20 bg-card"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className={`h-5 w-5 ${billingInfo?.hasPaymentMethod ? "text-primary" : "text-amber-400"}`} />
            Betalmetodstatus
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingInfo?.hasPaymentMethod ? (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <span>Betalmetod tillagd</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="h-5 w-5" />
              <span>Ingen betalmetod tillagd</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Status - OLD SECTION REMOVED */}
      <div className="space-y-2 hidden">
        <h3 className="text-sm font-medium">Betalmetodstatus</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${billingInfo.hasPaymentMethod ? "bg-green-500" : "bg-red-500"}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {billingInfo.hasPaymentMethod ? "Betalmetod tillagd" : "Ingen betalmetod"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {billingInfo.hasPaymentMethod
                    ? "Du kan redigera bilder"
                    : "Lägg till betalmetod via Stripe-portalen för att redigera bilder"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Dashboard */}
      <Card className="animate-fade-in border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            Månatlig användning -{" "}
            {new Date().toLocaleDateString("sv-SE", {
              month: "long",
              year: "numeric",
            })}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Översikt över företagets användning och kostnader per användare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trial info notice */}
          {billingInfo?.trial?.isInTrial && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <Sparkles className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-500">Under testperioden debiteras inga kostnader</p>
            </div>
          )}

          {/* Monthly Fee */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
            <span className="font-medium">Månadsavgift</span>
            <span className={`text-xl font-bold ${billingInfo?.trial?.isInTrial ? "text-green-500" : "text-primary"}`}>
              {billingInfo?.trial?.isInTrial ? "0" : PRICES.MONTHLY_FEE} kr
            </span>
          </div>

          {/* Per-user breakdown */}
          {userUsageStats.map((userStat) => (
            <div
              key={userStat.userId}
              className="flex flex-col gap-3 p-4 rounded-lg bg-gradient-to-br from-muted/50 via-transparent to-transparent border border-border/30"
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
                <span className="text-sm font-medium text-muted-foreground">Kostnad (bilder):</span>
                <span
                  className={`text-base font-semibold ${billingInfo?.trial?.isInTrial ? "text-green-500" : "text-foreground"}`}
                >
                  {billingInfo?.trial?.isInTrial ? "0.00" : userStat.cost.toFixed(2)} kr
                </span>
              </div>
            </div>
          ))}
          {userUsageStats.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">Ingen bildanvändning denna månad</div>
          )}

          {/* Usage-based cost summary */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <span className="font-medium">Redigerade bilder (totalt)</span>
              <p className="text-xs text-muted-foreground">
                {totalUsage.editedImages} × {PRICES.EDITED_IMAGE} kr
              </p>
            </div>
            <span
              className={`text-xl font-bold ${billingInfo?.trial?.isInTrial ? "text-green-500" : "text-foreground"}`}
            >
              {billingInfo?.trial?.isInTrial ? "0.00" : totalUsage.cost.toFixed(2)} kr
            </span>
          </div>

          {/* Total monthly cost */}
          <div className="flex justify-between items-center pt-4 border-t-2 border-primary/20">
            <span className="text-lg font-semibold">Total kostnad denna månad:</span>
            <span className={`text-2xl font-bold ${billingInfo?.trial?.isInTrial ? "text-green-500" : "text-primary"}`}>
              {billingInfo?.trial?.isInTrial ? "0" : (PRICES.MONTHLY_FEE + totalUsage.cost).toFixed(2)} kr
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Manage Billing */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Hantera betalning</h3>
        <Card>
          <CardContent className="pt-6">
            {isNativeApp() ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Hantera ditt konto och din prenumeration via vår webbportal.
                </p>
                <Button variant="outline" className="w-full" onClick={() => openExternalUrl("https://luvero.se")}>
                  Gå till Luvero.se
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Button onClick={openCustomerPortal} disabled={openingPortal} className="w-full">
                  {openingPortal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Öppna Stripe-portal
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Hantera dina betalningsmetoder, se fakturor och uppdatera betalningsinformation
                </p>
              </>
            )}
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
                  <div key={invoice.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {new Date(invoice.created).toLocaleDateString("sv-SE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {invoice.status === "paid" ? "Betald" : invoice.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                      </span>
                      {invoice.invoicePdf && (
                        <Button variant="outline" size="sm" onClick={() => openExternalUrl(invoice.invoicePdf!)}>
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
