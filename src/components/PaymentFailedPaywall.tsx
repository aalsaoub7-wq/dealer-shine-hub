import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isNativeApp } from "@/lib/utils";
import { openExternalUrl } from "@/lib/nativeCapabilities";
import { XCircle } from "lucide-react";
import luveroLogo from "@/assets/luvero-logo.png";

export const PaymentFailedPaywall = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdatePaymentMethod = async () => {
    if (isNativeApp()) {
      await openExternalUrl("https://luvero.se/dashboard");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Fel",
        description: "Kunde inte öppna betalningsportalen. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <img src={luveroLogo} alt="Luvero" className="w-16 h-16 opacity-80" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-center">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Betalning misslyckades
          </h1>
          <p className="text-muted-foreground">
            Vi kunde inte debitera ditt kort. Uppdatera din betalningsmetod för att fortsätta använda Luvero.
          </p>
        </div>

        <Button
          onClick={handleUpdatePaymentMethod}
          disabled={loading}
          className="w-full bg-gradient-button hover:bg-gradient-hover shadow-glow"
          size="lg"
        >
          {loading ? "Laddar..." : isNativeApp() ? "Gå till luvero.se" : "Uppdatera betalningsmetod"}
        </Button>

        {isNativeApp() && (
          <p className="text-xs text-muted-foreground">
            Av säkerhetsskäl hanteras betalningar via webbläsaren.
          </p>
        )}
      </div>
    </div>
  );
};
