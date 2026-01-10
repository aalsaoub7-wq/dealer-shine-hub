import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2, Crown, ArrowRight, ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { PLANS, PlanType } from "@/lib/usageTracking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { analytics } from "@/lib/analytics";

// Plan tier order for determining upgrade vs downgrade
const PLAN_TIERS: Record<PlanType, number> = { start: 1, pro: 2, elit: 3 };

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanType;
  currentPeriodEnd?: string | null;
  onPlanChanged: () => void;
}

export const ChangePlanDialog = ({ 
  open, 
  onOpenChange, 
  currentPlan,
  currentPeriodEnd,
  onPlanChanged 
}: ChangePlanDialogProps) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentPlan);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const changeType = useMemo(() => {
    if (selectedPlan === currentPlan) return 'none';
    const currentTier = PLAN_TIERS[currentPlan];
    const selectedTier = PLAN_TIERS[selectedPlan];
    return selectedTier > currentTier ? 'upgrade' : 'downgrade';
  }, [selectedPlan, currentPlan]);

  const effectiveDate = useMemo(() => {
    if (!currentPeriodEnd) return null;
    return new Date(currentPeriodEnd).toLocaleDateString('sv-SE');
  }, [currentPeriodEnd]);

  const handleChangePlan = async () => {
    if (selectedPlan === currentPlan) {
      onOpenChange(false);
      return;
    }

    try {
      setIsUpdating(true);
      
      const { data, error } = await supabase.functions.invoke("update-subscription", {
        body: { newPlan: selectedPlan }
      });

      if (error) throw error;

      // Track analytics
      analytics.planChanged(currentPlan, selectedPlan, changeType === 'upgrade');

      onPlanChanged();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error changing plan:", error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ändra plan",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentPlanConfig = PLANS[currentPlan];
  const selectedPlanConfig = PLANS[selectedPlan];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Byt plan
          </DialogTitle>
          <DialogDescription>
            Uppgraderingar träder i kraft omedelbart. Nedgraderingar aktiveras vid nästa faktureringsperiod.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {(Object.entries(PLANS) as [PlanType, typeof PLANS.start][]).map(([key, plan]) => (
            <div
              key={key}
              onClick={() => setSelectedPlan(key)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPlan === key 
                  ? `${plan.borderClass} ${plan.bgClass}` 
                  : key === currentPlan
                    ? 'border-border bg-muted/30 opacity-60'
                    : 'border-border hover:border-border/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === key ? plan.borderClass : 'border-muted-foreground'
                  }`}>
                    {selectedPlan === key && (
                      <div className={`w-2 h-2 rounded-full ${plan.bgClass.replace('/10', '')}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${plan.colorClass}`}>{plan.name}</span>
                      {key === currentPlan && (
                        <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                          Nuvarande
                        </span>
                      )}
                      {plan.isPopular && key !== currentPlan && (
                        <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                          Populär
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${plan.colorClass}`}>{plan.monthlyFee} kr/mån</p>
                  <p className="text-sm text-muted-foreground">+ {plan.pricePerImage} kr/bild</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedPlan !== currentPlan && (
          <div className={`p-3 rounded-lg border ${
            changeType === 'upgrade' 
              ? 'bg-green-500/5 border-green-500/20' 
              : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              {changeType === 'upgrade' ? (
                <ArrowUp className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-amber-500" />
              )}
              <span className={currentPlanConfig.colorClass}>{currentPlanConfig.name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className={selectedPlanConfig.colorClass}>{selectedPlanConfig.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {changeType === 'upgrade' ? (
                "Uppgradering aktiveras omedelbart. Återstående tid på nuvarande plan krediteras."
              ) : (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Nedgradering aktiveras {effectiveDate || "vid nästa faktureringsperiod"}
                </span>
              )}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Avbryt
          </Button>
          <Button 
            onClick={handleChangePlan} 
            disabled={isUpdating || selectedPlan === currentPlan}
            className={changeType === 'downgrade' ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedPlan === currentPlan 
              ? "Ingen ändring" 
              : changeType === 'upgrade' 
                ? "Uppgradera nu" 
                : "Schemalägg nedgradering"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
