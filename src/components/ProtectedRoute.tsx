import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TrialExpiredPaywall } from "@/components/TrialExpiredPaywall";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const VERIFICATION_TIMEOUT_MS = 5000;

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [paywallChecked, setPaywallChecked] = useState<boolean>(false);
  const isMountedRef = useRef(true);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const checkVerificationWithTimeout = async (userId: string, isGoogle: boolean): Promise<boolean> => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), VERIFICATION_TIMEOUT_MS),
        );

        const verificationPromise = supabase.functions.invoke("get-verification-status", {
          body: { userId },
        });

        const { data, error } = await Promise.race([verificationPromise, timeoutPromise]);

        if (error) {
          console.error("Error checking verification:", error);
          return true; // Fallback to allow access
        }

        if (isGoogle) {
          return data?.phoneVerified === true;
        } else {
          return data?.emailVerified === true && data?.phoneVerified === true;
        }
      } catch (err) {
        console.error("Verification check timeout or error:", err);
        return true; // Fallback to allow access on timeout
      }
    };

    const checkTrialAndPayment = async (): Promise<boolean> => {
      try {
        const { data, error } = await supabase.functions.invoke("get-billing-info");
      if (error) {
        console.error("Error checking billing info:", error);
        return true; // Fallback: show paywall on error (safer default)
      }

        // Only show paywall if: trial is over AND no payment method AND no active subscription
        const isInTrial = data?.trial?.isInTrial ?? true;
        const hasPaymentMethod = data?.hasPaymentMethod ?? false;
        const hasActiveSubscription = data?.hasActiveSubscription ?? false;
        const isAdmin = data?.isAdmin ?? true;

        // Only block admins - employees should still have access (admin's responsibility)
        // Also allow through if user has an active subscription (even if hasPaymentMethod is false)
        if (!isInTrial && !hasPaymentMethod && !hasActiveSubscription && isAdmin) {
          return true; // Show paywall
        }

        return false;
      } catch (err) {
        console.error("Error checking trial/payment:", err);
        return false; // Fallback: don't show paywall on error
      }
    };

    const checkAuth = async () => {
      if (hasCheckedRef.current) return;
      hasCheckedRef.current = true;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMountedRef.current) return;

      if (!session) {
        setIsAuthenticated(false);
        setIsVerified(null);
        setPaywallChecked(true);
        return;
      }

      setIsAuthenticated(true);

      const isGoogle = session.user.app_metadata?.provider === "google";
      const verified = await checkVerificationWithTimeout(session.user.id, isGoogle);

      if (isMountedRef.current) {
        setIsVerified(verified);
      }

      // Only check paywall if verified
      if (verified && isMountedRef.current) {
        const needsPaywall = await checkTrialAndPayment();
        if (isMountedRef.current) {
          setShowPaywall(needsPaywall);
          setPaywallChecked(true);
        }
      } else {
        setPaywallChecked(true);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMountedRef.current) return;
      
      // Skip if already checked - prevents re-triggering on tab switch
      if (hasCheckedRef.current) return;

      if (!session) {
        setIsAuthenticated(false);
        setIsVerified(null);
        setShowPaywall(false);
        setPaywallChecked(true);
        return;
      }

      // Only recheck if not already authenticated
      if (isAuthenticated) return;

      setIsAuthenticated(true);

      const isGoogle = session.user.app_metadata?.provider === "google";
      const verified = await checkVerificationWithTimeout(session.user.id, isGoogle);

      if (isMountedRef.current) {
        setIsVerified(verified);
      }

      // Only check paywall if verified
      if (verified && isMountedRef.current) {
        const needsPaywall = await checkTrialAndPayment();
        if (isMountedRef.current) {
          setShowPaywall(needsPaywall);
          setPaywallChecked(true);
        }
      } else {
        setPaywallChecked(true);
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Loading state
  if (isAuthenticated === null || (isAuthenticated && isVerified === null) || (isAuthenticated && isVerified && !paywallChecked)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but not verified
  if (!isVerified) {
    return <Navigate to="/verify" replace />;
  }

  // Trial expired and no payment method (admin only)
  if (showPaywall) {
    return <TrialExpiredPaywall />;
  }

  return <>{children}</>;
};
