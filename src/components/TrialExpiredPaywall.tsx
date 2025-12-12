import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isNativeApp } from "@/lib/utils";
import { openExternalUrl } from "@/lib/nativeCapabilities";
import { AlertTriangle, CreditCard, ExternalLink } from "lucide-react";
import luveroLogo from "@/assets/luvero-logo.png";

export const TrialExpiredPaywall = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleOpenPayment = async () => {
    if (isNativeApp()) {
      // Native app: Open website in external browser
      await openExternalUrl("https://luvero.se/dashboard");
      return;
    }

    // Web app: Open Stripe Customer Portal directly
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Fel",
        description: "Kunde inte öppna betalningssidan. Försök igen.",
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
            <AlertTriangle className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Din testperiod har gått ut
          </h1>
          <p className="text-muted-foreground">
            För att fortsätta använda Luvero behöver du lägga till en betalmetod.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3 text-left">
            <CreditCard className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Lägg till betalmetod</p>
              <p className="text-sm text-muted-foreground">
                {isNativeApp() 
                  ? "Du kommer att skickas till luvero.se för att lägga till betalmetod."
                  : "Öppna Stripe för att lägga till kort eller annan betalmetod."}
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleOpenPayment} 
          disabled={loading}
          className="w-full bg-gradient-button hover:bg-gradient-hover shadow-glow"
          size="lg"
        >
          {loading ? (
            "Öppnar..."
          ) : (
            <>
              {isNativeApp() ? "Gå till luvero.se" : "Lägg till betalmetod"}
              <ExternalLink className="w-4 h-4 ml-2" />
            </>
          )}
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
