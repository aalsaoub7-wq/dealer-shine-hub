import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import luveroLogo from "@/assets/luvero-logo.png";
import luveroLogoText from "@/assets/luvero-logo-text.png";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const authSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "E-postadress krävs")
    .email("Ogiltig e-postadress")
    .max(255, "E-postadressen får vara max 255 tecken"),
  password: z
    .string()
    .min(6, "Lösenordet måste vara minst 6 tecken")
    .max(72, "Lösenordet får vara max 72 tecken"),
  inviteCode: z.string().optional(),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(() => {
    // Check if mode=signup is in URL
    return searchParams.get('mode') !== 'signup';
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; inviteCode?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate input
      const validation = authSchema.safeParse({ email, password, inviteCode });
      if (!validation.success) {
        const fieldErrors: { email?: string; password?: string; inviteCode?: string } = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as "email" | "password" | "inviteCode"] = err.message;
          }
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        });
        if (error) throw error;
        toast({ title: "Välkommen tillbaka!" });
        navigate("/dashboard");
      } else {
        // If invite code provided, validate it first
        if (inviteCode) {
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .select("id, employee_invite_code")
            .eq("employee_invite_code", inviteCode.toUpperCase())
            .single();

          if (companyError || !companyData) {
            toast({
              title: "Ogiltig kod",
              description: "Inbjudningskoden är ogiltig.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }

      const { data: authData, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            is_employee_signup: !!inviteCode,
            invite_code: inviteCode || null,
          },
        },
      });
        
        if (error) throw error;

        // If admin signup (no invite code), trigger auto Stripe customer creation
        if (!inviteCode && authData.user) {
          try {
            // Get the user's newly created company_id
            const { data: userCompany } = await supabase
              .from("user_companies")
              .select("company_id")
              .eq("user_id", authData.user.id)
              .single();

            if (userCompany) {
              // Trigger auto Stripe customer creation in background
              supabase.functions.invoke("trigger-auto-stripe-customer", {
                body: {
                  company_id: userCompany.company_id,
                  user_id: authData.user.id,
                },
              }).then(() => {
                console.log("Stripe customer creation triggered");
              }).catch((err) => {
                console.error("Error triggering Stripe customer creation:", err);
              });
            }
          } catch (err) {
            console.error("Error in auto Stripe customer creation:", err);
            // Don't fail the signup if this fails
          }
        }

        // Trigger handles linking user to company automatically
        toast({ title: "Konto skapat! Vänligen logga in." });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
      <Card className="w-full max-w-md bg-gradient-card border-border/50 shadow-glow">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={luveroLogo} alt="Luvero Orbit Logo" className="w-16 h-16" />
          </div>
          <img src={luveroLogoText} alt="Luvero" className="h-16 mx-auto" />
          <CardDescription>
            {isLogin ? "Logga in på ditt återförsäljarkonto" : "Skapa ditt återförsäljarkonto"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLogin && (
            <Alert className="mb-4 border-primary/20 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm text-foreground ml-2">
                <strong>OBS!</strong> Om du har fått en kod av din admin, skapa ett konto med E-postadress och kod istället för Google
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            type="button"
            variant="outline"
            className="w-full bg-background hover:bg-accent border-border"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Fortsätt med Google
          </Button>
          
          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              eller
            </span>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-postadress
              </label>
              <Input
                id="email"
                type="email"
                placeholder="namn@företag.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Lösenord
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
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="inviteCode" className="text-sm font-medium">
                  Inbjudningskod (valfritt)
                </label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="Ange kod från din arbetsgivare"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  disabled={loading}
                  className={errors.inviteCode ? "border-destructive" : ""}
                />
                {errors.inviteCode && (
                  <p className="text-sm text-destructive">{errors.inviteCode}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Lämna tomt för att skapa ett nytt företag
                </p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Laddar..." : isLogin ? "Logga in" : "Skapa konto"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
              disabled={loading}
            >
              {isLogin ? "Inget konto? Skapa ett här" : "Har redan ett konto? Logga in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
