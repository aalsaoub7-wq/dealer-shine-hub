// React hook för Blocket-integration
// Använd denna i komponenter som ska visa/hantera Blocket-status

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  syncCarToBlocket,
  getBlocketStatus,
  subscribeToBlocketStatus,
  formatBlocketStatus,
  validateCarForBlocket,
} from "@/lib/blocket";

export function useBlocketSync(carId: string | null) {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Hämta initial status
  useEffect(() => {
    if (!carId) return;

    const fetchStatus = async () => {
      const data = await getBlocketStatus(carId);
      setStatus(data);
    };

    fetchStatus();
  }, [carId]);

  // Prenumerera på förändringar
  useEffect(() => {
    if (!carId) return;

    const unsubscribe = subscribeToBlocketStatus(carId, (newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, [carId]);

  // Synka till Blocket
  const syncToBlocket = async (car: any) => {
    if (!carId) return;

    // Validera först
    const validationError = validateCarForBlocket(car);
    if (validationError) {
      toast({
        title: "Kan inte synka till Blocket",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await syncCarToBlocket(carId);

      if (result.ok) {
        toast({
          title: "Synkad till Blocket",
          description: "Bilen har synkats till Blocket",
        });
        if (result.status) {
          setStatus(result.status);
        }
      } else {
        toast({
          title: "Synkning misslyckades",
          description: result.error || "Ett fel uppstod",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Synkning misslyckades",
        description: error.message || "Ett oväntat fel uppstod",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    status,
    isLoading,
    syncToBlocket,
    statusText: formatBlocketStatus(status),
    isPublished: status?.state === "created",
    hasError: status?.last_action_state === "error",
  };
}
