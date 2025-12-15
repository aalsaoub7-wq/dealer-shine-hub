import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import luveroLogo from "@/assets/luvero-logo.png";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <img src={luveroLogo} alt="Luvero" className="w-16 h-16 opacity-80" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Betalning genomförd!
          </h1>
          <p className="text-muted-foreground">
            Tack för din prenumeration. Du kan nu använda alla funktioner i Luvero.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            Du skickas automatiskt till din dashboard om {countdown} sekunder...
          </p>
        </div>

        <Button 
          onClick={() => navigate("/dashboard")}
          className="w-full bg-gradient-button hover:bg-gradient-hover shadow-glow"
          size="lg"
        >
          Gå till Dashboard nu
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
