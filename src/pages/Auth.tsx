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
// Separator import removed - Google OAuth disabled
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { analytics, identifyUser } from "@/lib/analytics";

const authSchema = z.object({
  email: z.string().trim().min(1, "E-postadress krävs").email("Ogiltig e-postadress").max(255, "E-postadressen får vara max 255 tecken"),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken").max(72, "Lösenordet får vara max 72 tecken"),
  inviteCode: z.string().optional(),
  signupCode: z.string().optional()
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(() => {
    // Check if mode=signup is in URL
    return searchParams.get("mode") !== "signup";
  });
  // Get plan from URL (start, pro, elit)
  const selectedPlan = searchParams.get("plan") || "start";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    inviteCode?: string;
    signupCode?: string;
  }>({});
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  // Google OAuth removed - using email only

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const emailValidation = z.string().email("Ogiltig e-postadress").safeParse(email);
      if (!emailValidation.success) {
        setErrors({
          email: emailValidation.error.errors[0].message
        });
        setLoading(false);
        return;
      }

      // Use custom password reset flow
      const {
        error
      } = await supabase.functions.invoke("request-password-reset", {
        body: {
          email: email.trim().toLowerCase(),
          redirectUrl: `${window.location.origin}/reset-password`
        }
      });
      if (error) throw error;
      setResetEmailSent(true);
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      // Validate input
      const validation = authSchema.safeParse({
        email,
        password,
        inviteCode,
        signupCode
      });
      if (!validation.success) {
        const fieldErrors: {
          email?: string;
          password?: string;
          inviteCode?: string;
          signupCode?: string;
        } = {};
        validation.error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as "email" | "password" | "inviteCode" | "signupCode"] = err.message;
          }
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const {
          data: loginData,
          error
        } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password
        });
        if (error) throw error;

        // Track login
        if (loginData.user) {
          identifyUser(loginData.user.id, {
            email: validation.data.email
          });
          analytics.userLoggedIn('email');
        }

        // Redirect to verify to check verification status
        navigate("/verify");
      } else {
        // Check if signup_code is provided (new admin with pre-linked Stripe)
        if (signupCode) {
          // Validate signup code
          const { data: codeData, error: codeError } = await supabase
            .from("public_signup_codes")
            .select("id, is_used, company_name")
            .eq("code", signupCode.toUpperCase())
            .maybeSingle();

          if (codeError || !codeData) {
            setErrors({ signupCode: "Ogiltig företagskod" });
            setLoading(false);
            return;
          }

          if (codeData.is_used) {
            setErrors({ signupCode: "Denna kod har redan använts" });
            setLoading(false);
            return;
          }

          // Signup with signup_code
          const { data: authData, error } = await supabase.auth.signUp({
            email: validation.data.email,
            password: validation.data.password,
            options: {
              emailRedirectTo: `${window.location.origin}/dashboard`,
              data: {
                signup_code: signupCode.toUpperCase()
              }
            }
          });
          if (error) throw error;

          // Send email verification
          if (authData.user) {
            try {
              await supabase.functions.invoke("send-email-verification", {
                body: {
                  userId: authData.user.id,
                  email: validation.data.email
                }
              });
            } catch (err) {
              console.error("Error sending verification email:", err);
            }

            // Track signup
            identifyUser(authData.user.id, { email: validation.data.email });
            analytics.userSignedUp('email', 'custom', false);
          }

          toast({
            title: "Konto skapat!",
            description: `Välkommen till ${codeData.company_name || 'Luvero'}! Kolla din e-post för verifiering.`
          });

          navigate("/verify");
          return;
        }

        // Check if employee invite code is provided
        if (inviteCode) {
          // Use the secure validate_invite_code function instead of querying companies directly
          const {
            data: companyId,
            error: validateError
          } = await supabase.rpc("validate_invite_code", {
            code: inviteCode.toUpperCase()
          });
          if (validateError || !companyId) {
            toast({
              title: "Ogiltig kod",
              description: "Inbjudningskoden är ogiltig.",
              variant: "destructive"
            });
            setLoading(false);
            return;
          }

          // Employee signup with invite code
          const { data: authData, error } = await supabase.auth.signUp({
            email: validation.data.email,
            password: validation.data.password,
            options: {
              emailRedirectTo: `${window.location.origin}/dashboard`,
              data: {
                is_employee_signup: true,
                invite_code: inviteCode.toUpperCase()
              }
            }
          });
          if (error) throw error;

          // Send email verification
          if (authData.user) {
            try {
              await supabase.functions.invoke("send-email-verification", {
                body: {
                  userId: authData.user.id,
                  email: validation.data.email
                }
              });
            } catch (err) {
              console.error("Error sending verification email:", err);
            }

            // Track signup
            identifyUser(authData.user.id, { email: validation.data.email });
            analytics.userSignedUp('email', selectedPlan, true);
          }

          navigate("/verify");
          return;
        }

        // BLOCKED: Normal admin signup without code is no longer allowed
        // All new accounts must use either a signup code (new company) or employee invite code
        setErrors({ signupCode: "Företagskod krävs för att skapa konto. Kontakta oss på hej@luvero.se" });
        setLoading(false);
        return;

        /* === PRESERVED FOR FUTURE: Normal admin signup (trial) ===
        // Normal admin signup (no code) - check IP first
        const {
          data: ipCheck,
          error: ipError
        } = await supabase.functions.invoke("check-admin-ip");
        if (ipError) {
          console.error("IP check error:", ipError);
        } else if (ipCheck && !ipCheck.allowed) {
          toast({
            title: "Registrering blockerad",
            description: ipCheck.message || "Du har redan ett admin konto",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const {
          data: authData,
          error
        } = await supabase.auth.signUp({
          email: validation.data.email,
          password: validation.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              is_employee_signup: false,
              invite_code: null
            }
          }
        });
        if (error) throw error;

        // If admin signup (no invite code), save IP and trigger Stripe
        if (authData.user) {
          try {
            // Save the admin IP
            const {
              data: ipData
            } = await supabase.functions.invoke("check-admin-ip");
            if (ipData?.ip) {
              await supabase.functions.invoke("save-admin-ip", {
                body: {
                  userId: authData.user.id,
                  ipAddress: ipData.ip
                }
              });
            }

            // Get the user's newly created company_id
            const {
              data: userCompany
            } = await supabase.from("user_companies").select("company_id").eq("user_id", authData.user.id).single();
            if (userCompany) {
              // Trigger auto Stripe customer creation in background with selected plan
              supabase.functions.invoke("trigger-auto-stripe-customer", {
                body: {
                  company_id: userCompany.company_id,
                  user_id: authData.user.id,
                  plan: selectedPlan
                }
              }).then(() => {
                console.log(`Stripe customer creation triggered with plan: ${selectedPlan}`);
              }).catch(err => {
                console.error("Error triggering Stripe customer creation:", err);
              });
            }
          } catch (err) {
            console.error("Error in admin signup post-processing:", err);
            // Don't fail the signup if this fails
          }
        }
        === END PRESERVED CODE === */

        /* === PRESERVED: Email verification and tracking for trial signups ===
        // Send email verification
        if (authData.user) {
          try {
            await supabase.functions.invoke("send-email-verification", {
              body: {
                userId: authData.user.id,
                email: validation.data.email
              }
            });
          } catch (err) {
            console.error("Error sending verification email:", err);
          }
        }

        // Track signup
        if (authData.user) {
          identifyUser(authData.user.id, {
            email: validation.data.email
          });
          analytics.userSignedUp('email', selectedPlan, false);
          analytics.trialStarted(selectedPlan);
        }
        navigate("/verify");
        === END PRESERVED === */
      }
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive"
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
            <img src={luveroLogo} alt="" className="w-16 h-16" />
          </div>
          <img src={luveroLogoText} alt="" className="h-12 mx-auto" />
        </CardHeader>
        <CardContent>
          {isForgotPassword ? (
            resetEmailSent ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Vi har skickat ett e-postmeddelande med instruktioner för att återställa ditt lösenord.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetEmailSent(false);
                  }}
                  className="w-full"
                >
                  Tillbaka till inloggning
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="text-sm font-medium">
                    E-postadress
                  </label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="namn@företag.se"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Skickar..." : "Skicka återställningslänk"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full"
                  disabled={loading}
                >
                  Tillbaka till inloggning
                </Button>
              </form>
            )
          ) : (
            <>
              {!isLogin && (
                <Alert className="mb-4 border-primary/20 bg-primary/5">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm text-foreground ml-2">
                    <strong>OBS!</strong> Om du har fått en företagskod, ange den nedan för att skapa ditt konto.
                  </AlertDescription>
                </Alert>
              )}

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
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
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
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                      disabled={loading}
                    >
                      Glömt lösenord?
                    </button>
                  )}
                </div>

                {!isLogin && (
                  <>
                    {/* Signup Code - for new admins with pre-linked Stripe */}
                    <div className="space-y-2">
                      <label htmlFor="signupCode" className="text-sm font-medium">
                        Företagskod
                      </label>
                      <Input
                        id="signupCode"
                        type="text"
                        placeholder="Ange din företagskod"
                        value={signupCode}
                        onChange={e => setSignupCode(e.target.value.toUpperCase())}
                        disabled={loading || !!inviteCode}
                        className={errors.signupCode ? "border-destructive" : ""}
                      />
                      {errors.signupCode && <p className="text-sm text-destructive">{errors.signupCode}</p>}
                      <p className="text-xs text-muted-foreground">
                        Har du fått en kod från Luvero? Ange den här.
                      </p>
                    </div>

                    {/* Employee Invite Code - for team members */}
                    <div className="space-y-2">
                      <label htmlFor="inviteCode" className="text-sm font-medium">
                        Inbjudningskod (för anställda)
                      </label>
                      <Input
                        id="inviteCode"
                        type="text"
                        placeholder="Ange kod från din arbetsgivare"
                        value={inviteCode}
                        onChange={e => setInviteCode(e.target.value.toUpperCase())}
                        disabled={loading || !!signupCode}
                        className={errors.inviteCode ? "border-destructive" : ""}
                      />
                      {errors.inviteCode && <p className="text-sm text-destructive">{errors.inviteCode}</p>}
                      <p className="text-xs text-muted-foreground">
                        Anställda anger inbjudningskod från sin arbetsgivare
                      </p>
                    </div>
                  </>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
