import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, CheckCircle2, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type Step = "email" | "phone-input" | "phone-verify" | "complete";

export default function Verify() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailCode, setEmailCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkUserAndStatus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [resendCooldown]);

  const checkUserAndStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    setUser({ id: session.user.id, email: session.user.email || "" });
    
    // Check if Google user
    const isGoogle = session.user.app_metadata?.provider === "google";
    setIsGoogleUser(isGoogle);

    // Get verification status
    const { data } = await supabase.functions.invoke("get-verification-status", {
      body: { userId: session.user.id },
    });

    if (data?.fullyVerified) {
      navigate("/dashboard");
      return; // Don't set initialLoading false - we're navigating away
    }

    // Google users skip email verification
    if (isGoogle && data?.phoneVerified) {
      navigate("/dashboard");
      return; // Don't set initialLoading false - we're navigating away
    }

    if (isGoogle) {
      setStep("phone-input");
    } else if (data?.emailVerified) {
      setStep("phone-input");
    } else {
      // Send initial email verification
      sendEmailVerification();
    }
    
    setInitialLoading(false);
  };

  const sendEmailVerification = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-email-verification", {
        body: { userId: user.id, email: user.email },
      });

      if (error) throw error;

      setResendCooldown(60);
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skicka verifieringskod",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!user || emailCode.length !== 6) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-code", {
        body: { userId: user.id, type: "email", code: emailCode },
      });

      if (error) throw error;

      if (data.success) {
        setStep("phone-input");
      } else {
        toast({
          title: "Fel",
          description: data.error || "Felaktig kod",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte verifiera kod",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOtp = async () => {
    if (!user || !phoneNumber) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-phone-otp", {
        body: { userId: user.id, phoneNumber },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Fel",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setStep("phone-verify");
      setResendCooldown(60);
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skicka SMS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneCode = async () => {
    if (!user || phoneCode.length !== 6) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-code", {
        body: { userId: user.id, type: "phone", code: phoneCode },
      });

      if (error) throw error;

      if (data.success) {
        setStep("complete");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        toast({
          title: "Fel",
          description: data.error || "Felaktig kod",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte verifiera kod",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const formatPhoneInput = (value: string) => {
    // Remove non-digits
    let digits = value.replace(/\D/g, "");
    
    // Format for display
    if (digits.startsWith("46")) {
      digits = "0" + digits.substring(2);
    }
    
    // Format as 07X XXX XX XX
    if (digits.length > 3) {
      digits = digits.substring(0, 3) + " " + digits.substring(3);
    }
    if (digits.length > 7) {
      digits = digits.substring(0, 7) + " " + digits.substring(7);
    }
    if (digits.length > 10) {
      digits = digits.substring(0, 10) + " " + digits.substring(10);
    }
    
    return digits.substring(0, 13); // Max length
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {step === "email" && <Mail className="h-6 w-6 text-primary" />}
            {(step === "phone-input" || step === "phone-verify") && <Phone className="h-6 w-6 text-primary" />}
            {step === "complete" && <CheckCircle2 className="h-6 w-6 text-green-500" />}
          </div>
          <CardTitle className="text-2xl">
            {step === "email" && "Verifiera din e-post"}
            {step === "phone-input" && "Ange ditt telefonnummer"}
            {step === "phone-verify" && "Verifiera ditt nummer"}
            {step === "complete" && "Verifiering klar!"}
          </CardTitle>
          <CardDescription>
            {step === "email" && `Vi har skickat en 6-siffrig kod till ${user?.email}`}
            {step === "phone-input" && "Ange ditt svenska mobilnummer för att få en verifieringskod via SMS"}
            {step === "phone-verify" && "Ange koden du fick via SMS"}
            {step === "complete" && "Du omdirigeras till din dashboard..."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step indicators */}
          <div className="flex justify-center gap-2">
            {!isGoogleUser && (
              <div className={`h-2 w-16 rounded-full transition-colors ${
                step === "email" ? "bg-primary" : "bg-primary/30"
              }`} />
            )}
            <div className={`h-2 w-16 rounded-full transition-colors ${
              step === "phone-input" || step === "phone-verify" ? "bg-primary" : 
              step === "complete" ? "bg-primary/30" : "bg-muted"
            }`} />
            <div className={`h-2 w-16 rounded-full transition-colors ${
              step === "complete" ? "bg-green-500" : "bg-muted"
            }`} />
          </div>

          {/* Email verification step */}
          {step === "email" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  value={emailCode}
                  onChange={setEmailCode}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={verifyEmailCode}
                disabled={loading || emailCode.length !== 6}
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verifiera e-post
              </Button>

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={sendEmailVerification}
                  disabled={resendCooldown > 0 || loading}
                >
                  {resendCooldown > 0 ? `Skicka igen (${resendCooldown}s)` : "Skicka ny kod"}
                </Button>
              </div>
            </div>
          )}

          {/* Phone input step */}
          {step === "phone-input" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="tel"
                  placeholder="07X XXX XX XX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                  className="text-center text-lg tracking-wider"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Ange ditt svenska mobilnummer
                </p>
              </div>

              <Button
                onClick={sendPhoneOtp}
                disabled={loading || phoneNumber.replace(/\s/g, "").length < 10}
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Skicka SMS-kod
              </Button>

              {!isGoogleUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("email")}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tillbaka till e-post
                </Button>
              )}
            </div>
          )}

          {/* Phone verify step */}
          {step === "phone-verify" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  value={phoneCode}
                  onChange={setPhoneCode}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={verifyPhoneCode}
                disabled={loading || phoneCode.length !== 6}
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verifiera telefon
              </Button>

              <div className="text-center space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={sendPhoneOtp}
                  disabled={resendCooldown > 0 || loading}
                >
                  {resendCooldown > 0 ? `Skicka igen (${resendCooldown}s)` : "Skicka ny kod"}
                </Button>
                <br />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhoneCode("");
                    setStep("phone-input");
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Ändra telefonnummer
                </Button>
              </div>
            </div>
          )}

          {/* Complete step */}
          {step === "complete" && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Logout option */}
          {step !== "complete" && (
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full text-muted-foreground"
              >
                Logga ut och avbryt
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
