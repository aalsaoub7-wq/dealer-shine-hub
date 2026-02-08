import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";
import luveroLogo from "@/assets/luvero-logo.png";

interface ConnectionErrorScreenProps {
  onRetry: () => void;
  loading?: boolean;
}

export const ConnectionErrorScreen = ({ onRetry, loading }: ConnectionErrorScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <img src={luveroLogo} alt="Luvero" className="w-16 h-16 opacity-80" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-center">
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Något gick fel
          </h1>
          <p className="text-muted-foreground">
            Vi kunde inte nå servern just nu. Det kan bero på ett tillfälligt problem — försök igen om en stund.
          </p>
        </div>

        <Button
          onClick={onRetry}
          disabled={loading}
          className="w-full bg-gradient-button hover:bg-gradient-hover shadow-glow"
          size="lg"
        >
          {loading ? "Försöker igen..." : "Försök igen"}
        </Button>
      </div>
    </div>
  );
};
