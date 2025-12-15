import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isNativeApp } from "@/lib/utils";
import { openExternalUrl } from "@/lib/nativeCapabilities";
import { AlertTriangle, Check, Crown, Rocket, Zap } from "lucide-react";
import luveroLogo from "@/assets/luvero-logo.png";
type Plan = "start" | "pro" | "elit";
const PLANS = [{
  id: "start" as Plan,
  name: "Start",
  monthlyPrice: "239",
  perImagePrice: "4,95",
  description: "Billigast under 100 bilder",
  icon: Rocket,
  color: "text-green-500",
  borderColor: "border-green-500/50",
  bgColor: "bg-green-500/10"
}, {
  id: "pro" as Plan,
  name: "Pro",
  monthlyPrice: "449",
  perImagePrice: "1,95",
  description: "Bäst för de flesta",
  icon: Crown,
  color: "text-primary",
  borderColor: "border-primary",
  bgColor: "bg-primary/20",
  popular: true,
  recommended: true
}, {
  id: "elit" as Plan,
  name: "Elit",
  monthlyPrice: "995",
  perImagePrice: "0,99",
  description: "För 500+ bilder/månad",
  icon: Zap,
  color: "text-purple-500",
  borderColor: "border-purple-500/50",
  bgColor: "bg-purple-500/10"
}];
export const TrialExpiredPaywall = () => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("pro");
  const {
    toast
  } = useToast();
  const handleStartSubscription = async () => {
    if (isNativeApp()) {
      // Native app: Open website in external browser
      await openExternalUrl("https://luvero.se/dashboard");
      return;
    }

    // Web app: Create Stripe Checkout session
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          plan: selectedPlan
        }
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
  return <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
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

        {/* Plan selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
          const Icon = plan.icon;
          const isSelected = selectedPlan === plan.id;
          const isRecommended = 'recommended' in plan && plan.recommended;
          return <button 
            key={plan.id} 
            onClick={() => setSelectedPlan(plan.id)} 
            className={`relative p-4 rounded-lg border-2 transition-all text-left ${
              isRecommended 
                ? `${isSelected ? 'border-primary bg-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' : 'border-primary/70 bg-primary/10 hover:bg-primary/15'}` 
                : `${isSelected ? `${plan.borderColor} ${plan.bgColor}` : "border-border bg-card hover:border-muted-foreground/50"}`
            }`}
          >
                {isRecommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    ⭐ Rekommenderad
                  </span>
                )}
                {plan.popular && !isRecommended && <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Populär
                  </span>}
                
                <div className="flex items-center gap-2 mb-2 mt-1">
                  <Icon className={`w-5 h-5 ${plan.color}`} />
                  <span className={`font-semibold ${isRecommended ? 'text-primary' : 'text-foreground'}`}>{plan.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary ml-auto" />}
                </div>
                
                <div className="space-y-1">
                  <p className={`text-lg font-bold ${isRecommended ? 'text-primary' : 'text-foreground'}`}>
                    {plan.monthlyPrice} kr<span className="text-sm font-normal text-muted-foreground">/mån</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    + {plan.perImagePrice} kr/bild
                  </p>
                  {isRecommended && (
                    <p className="text-xs text-primary font-medium mt-2">
                      {plan.description}
                    </p>
                  )}
                </div>
              </button>;
        })}
        </div>

        <Button onClick={handleStartSubscription} disabled={loading} className="w-full bg-gradient-button hover:bg-gradient-hover shadow-glow" size="lg">
          {loading ? "Laddar..." : <>
              {isNativeApp() ? "Gå till luvero.se" : `Starta ${PLANS.find(p => p.id === selectedPlan)?.name}-prenumeration`}
            </>}
        </Button>

        {isNativeApp() && <p className="text-xs text-muted-foreground">
            Av säkerhetsskäl hanteras betalningar via webbläsaren.
          </p>}
      </div>
    </div>;
};