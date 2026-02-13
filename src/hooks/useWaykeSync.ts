// React hook for Wayke integration
// Mirrors useBlocketSync.ts pattern

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  syncCarToWayke,
  getWaykeStatus,
  subscribeToWaykeStatus,
  formatWaykeStatus,
  validateCarForWayke,
} from "@/lib/wayke";

export function useWaykeSync(carId: string | null) {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!carId) return;
    const fetchStatus = async () => {
      const data = await getWaykeStatus(carId);
      setStatus(data);
    };
    fetchStatus();
  }, [carId]);

  useEffect(() => {
    if (!carId) return;
    const unsubscribe = subscribeToWaykeStatus(carId, (newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, [carId]);

  const syncToWayke = async (car: any, imageUrls?: string[]) => {
    if (!carId) return;

    const validationError = validateCarForWayke(car);
    if (validationError) {
      toast({
        title: "Kan inte synka till Wayke",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await syncCarToWayke(carId, imageUrls);
      if (result.ok) {
        toast({
          title: "Synkad till Wayke",
          description: "Bilen har synkats till Wayke",
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
    syncToWayke,
    statusText: formatWaykeStatus(status),
    isPublished: status?.state === "created",
    hasError: status?.last_action_state === "error",
  };
}
