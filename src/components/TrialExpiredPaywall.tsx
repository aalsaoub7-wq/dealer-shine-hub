import { AlertTriangle, Mail } from "lucide-react";
import luveroLogo from "@/assets/luvero-logo.png";
import { Card, CardContent } from "@/components/ui/card";

// ========================================
// HIDDEN: Original plan selection code kept for future use
// when self-service model is re-enabled
// ========================================
/*
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isNativeApp } from "@/lib/utils";
import { openExternalUrl } from "@/lib/nativeCapabilities";
import { Check, Crown, Rocket, Zap } from "lucide-react";

type Plan = "start" | "pro" | "elit";
const PLANS = [{
  id: "start" as Plan,
  name: "Start",
  monthlyPrice: "349",
  perImagePrice: "5,95",
  description: "Billigast under 100 bilder",
  icon: Rocket,
  color: "text-green-500",
  borderColor: "border-green-500/50",
  bgColor: "bg-green-500/10"
}, {
  id: "pro" as Plan,
  name: "Pro",
  monthlyPrice: "449",
  perImagePrice: "2,95",
  description: "Mest populär",
  icon: Crown,
  color: "text-blue-500",
  borderColor: "border-blue-500/50",
  bgColor: "bg-blue-500/10",
  popular: true
}, {
  id: "elit" as Plan,
  name: "Elit",
  monthlyPrice: "995",
  perImagePrice: "1,95",
  description: "För 500+ bilder/månad",
  icon: Zap,
  color: "text-purple-500",
  borderColor: "border-purple-500/50",
  bgColor: "bg-purple-500/10"
}];

export const TrialExpiredPaywallOriginal = () => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("pro");
  const { toast } = useToast();
  
  const handleStartSubscription = async () => {
    if (isNativeApp()) {
      await openExternalUrl("https://luvero.se/dashboard");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { plan: selectedPlan }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Fel",
        description: "Kunde inte starta betalningen. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-6">
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
            Välj en plan för att fortsätta använda Luvero
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-4 rounded-lg border-2 transition-all text-left ${isSelected ? `${plan.borderColor} ${plan.bgColor}` : "border-border bg-card hover:border-muted-foreground/50"}`}
              >
                {plan.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Populär
                  </span>
                )}
                
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${plan.color}`} />
                  <span className="font-semibold text-foreground">{plan.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary ml-auto" />}
                </div>
                
                <div className="space-y-1">
                  <p className="text-lg font-bold text-foreground">
                    {plan.monthlyPrice} kr<span className="text-sm font-normal text-muted-foreground">/mån</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    + {plan.perImagePrice} kr/bild
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          onClick={handleStartSubscription}
          disabled={loading}
          className="w-full bg-gradient-button hover:bg-gradient-hover shadow-glow"
          size="lg"
        >
          {loading ? "Laddar..." : (
            <>
              {isNativeApp() ? "Gå till luvero.se" : `Starta ${PLANS.find(p => p.id === selectedPlan)?.name}-prenumeration`}
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
*/

export const TrialExpiredPaywall = () => {
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
            Konto ej aktiverat
          </h1>
          <p className="text-muted-foreground">
            Kontakta oss för att aktivera ditt konto
          </p>
        </div>

        <Card className="border-primary/20 bg-card">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Mail className="w-5 h-5" />
              <span className="font-medium">Kontakta oss</span>
            </div>
            
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Skicka ett mail till oss så hjälper vi dig att komma igång:
              </p>
              <a 
                href="mailto:hej@luvero.se" 
                className="block text-lg font-semibold text-primary hover:underline"
              >
                hej@luvero.se
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Vi svarar vanligtvis inom 24 timmar
        </p>
      </div>
    </div>
  );
};
