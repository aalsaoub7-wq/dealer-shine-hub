import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import luveroLogo from "@/assets/luvero-logo.png";
import { z } from "zod";

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
  const [isLogin, setIsLogin] = useState(true);
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
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

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
        navigate("/");
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
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (error) throw error;

        // Handle invite code after signup
        if (inviteCode && authData.user) {
          const { data: companyData } = await supabase
            .from("companies")
            .select("id")
            .eq("employee_invite_code", inviteCode.toUpperCase())
            .single();

          if (companyData) {
            // Delete auto-created company and user_companies entry
            const { data: userCompanies } = await supabase
              .from("user_companies")
              .select("company_id")
              .eq("user_id", authData.user.id)
              .single();

            if (userCompanies) {
              await supabase
                .from("companies")
                .delete()
                .eq("id", userCompanies.company_id);
            }

            // Link user to the company with the invite code
            await supabase
              .from("user_companies")
              .upsert({
                user_id: authData.user.id,
                company_id: companyData.id,
              });

            // Delete auto-created admin role
            await supabase
              .from("user_roles")
              .delete()
              .eq("user_id", authData.user.id);

            // Assign employee role
            await supabase
              .from("user_roles")
              .insert({
                user_id: authData.user.id,
                company_id: companyData.id,
                role: "employee",
              });
          }
        }

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
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">LuFlow ©</CardTitle>
          <CardDescription>
            {isLogin ? "Logga in på ditt återförsäljarkonto" : "Skapa ditt återförsäljarkonto"}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
