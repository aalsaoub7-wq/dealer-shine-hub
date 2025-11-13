// Komponent för att synka en bil till Blocket
// Lägg till denna i CarDetail-sidan eller CarCard

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { useBlocketSync } from "@/hooks/useBlocketSync";

interface BlocketSyncButtonProps {
  carId: string;
  car: any; // Hela car-objektet behövs för validering
  variant?: "default" | "outline" | "ghost";
}

export function BlocketSyncButton({ carId, car, variant = "default" }: BlocketSyncButtonProps) {
  const { status, isLoading, syncToBlocket, statusText, isPublished, hasError } =
    useBlocketSync(carId);

  const handleSync = () => {
    syncToBlocket(car);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSync}
        disabled={isLoading || !car.publish_on_blocket}
        variant={variant}
        size="sm"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
        {isLoading ? "Synkar..." : "Synka till Blocket"}
      </Button>

      {status && (
        <Badge
          variant={hasError ? "destructive" : isPublished ? "default" : "secondary"}
          className="flex items-center gap-1"
        >
          {hasError && <AlertCircle className="w-3 h-3" />}
          {isPublished && !hasError && <CheckCircle className="w-3 h-3" />}
          {statusText}
        </Badge>
      )}

      {status?.blocket_ad_id && (
        <Button
          variant="ghost"
          size="sm"
          asChild
        >
          <a
            href={`https://www.blocket.se/annons/${status.blocket_ad_id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      )}
    </div>
  );
}
