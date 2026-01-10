import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import luveroLogo from "@/assets/luvero-logo.png";
import luveroLogoText from "@/assets/luvero-logo-text.png";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const passwordSchema = z
  .string()
  .min(6, "Lösenordet måste vara minst 6 tecken")
  .max(72, "Lösenordet får vara max 72 tecken");

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a token in URL
    if (!token) {
      setIsValidToken(false);
      toast({
        title: "Ogiltig länk",
        description: "Återställningslänken är ogiltig.",
        variant: "destructive",
      });
    } else {
      setIsValidToken(true);
    }
  }, [token, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate password
      const validation = passwordSchema.safeParse(password);
      if (!validation.success) {
        setErrors({ password: validation.error.errors[0].message });
        setLoading(false);
        return;
      }

      // Check passwords match
      if (password !== confirmPassword) {
        setErrors({ confirmPassword: "Lösenorden matchar inte" });
        setLoading(false);
        return;
      }

      // Call custom reset-password edge function
      const { data, error } = await supabase.functions.invoke("reset-password", {
        body: {
          token,
          newPassword: password,
        },
      });

      if (error) {
        throw new Error(error.message || "Ett fel uppstod");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Redirect to login
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte uppdatera lösenordet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state if no token
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
        <Card className="w-full max-w-md bg-gradient-card border-border/50 shadow-glow">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <img src={luveroLogo} alt="Luvero Orbit Logo" className="w-16 h-16" />
            </div>
            <img src={luveroLogoText} alt="Luvero" className="h-12 mx-auto" />
            <CardDescription className="text-destructive">
              Återställningslänken är ogiltig eller har gått ut.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Tillbaka till inloggning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
      <Card className="w-full max-w-md bg-gradient-card border-border/50 shadow-glow">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={luveroLogo} alt="Luvero Orbit Logo" className="w-16 h-16" />
          </div>
          <img src={luveroLogoText} alt="Luvero" className="h-12 mx-auto" />
          <CardDescription>
            Ange ditt nya lösenord
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Nytt lösenord
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Bekräfta lösenord
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uppdaterar...
                </>
              ) : (
                "Uppdatera lösenord"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="w-full"
              disabled={loading}
            >
              Tillbaka till inloggning
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
