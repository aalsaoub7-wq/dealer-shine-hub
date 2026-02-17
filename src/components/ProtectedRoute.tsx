import { useEffect, useState, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TrialExpiredPaywall } from "@/components/TrialExpiredPaywall";
import { PaymentFailedPaywall } from "@/components/PaymentFailedPaywall";
import { ConnectionErrorScreen } from "@/components/ConnectionErrorScreen";
import { identifyUser, resetAnalytics, analytics } from "@/lib/analytics";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const VERIFICATION_TIMEOUT_MS = 5000;
const MAX_BILLING_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [paymentFailed, setPaymentFailed] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [paywallChecked, setPaywallChecked] = useState<boolean>(false);
  const [retryLoading, setRetryLoading] = useState<boolean>(false);
  const isMountedRef = useRef(true);
  const hasCheckedRef = useRef(false);

  const checkVerificationWithTimeout = useCallback(async (userId: string, isGoogle: boolean): Promise<boolean> => {
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
  }, []);

  const checkTrialAndPayment = useCallback(async (retryCount = 0): Promise<{ showPaywall: boolean; paymentFailed: boolean; connectionError: boolean }> => {
    try {
      const { data, error } = await supabase.functions.invoke("get-billing-info");
      
      if (error) {
        console.error(`Error checking billing info (attempt ${retryCount + 1}/${MAX_BILLING_RETRIES + 1}):`, error);
        
        // Retry on transient errors
        if (retryCount < MAX_BILLING_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          return checkTrialAndPayment(retryCount + 1);
        }
        
        // After all retries exhausted: show connection error, NOT paywall
        console.error("All billing info retries exhausted, showing connection error screen");
        return { showPaywall: false, paymentFailed: false, connectionError: false };
      }

      const isAdmin = data?.isAdmin ?? false;
      const hasActiveSubscription = data?.hasActiveSubscription ?? false;
      
      // Employees NEVER see paywall - only admins are responsible for billing
      if (!isAdmin) {
        return { showPaywall: false, paymentFailed: false, connectionError: false };
      }
      
      // Check if payment failed (past_due status) - block immediately for admins
      const subscriptionStatus = data?.subscription?.status;
      if (subscriptionStatus === "past_due") {
        return { showPaywall: false, paymentFailed: true, connectionError: false };
      }

      const hasPaymentMethod = data?.hasPaymentMethod ?? false;
      const subscriptionPeriodEnd = data?.subscription?.current_period_end as string | null | undefined;
      const subscriptionEndMs = subscriptionPeriodEnd ? new Date(subscriptionPeriodEnd).getTime() : null;
      
      // Subscription is valid if it hasn't expired yet
      const subscriptionStillValid =
        subscriptionEndMs !== null && !Number.isNaN(subscriptionEndMs) && subscriptionEndMs > Date.now();

      // Admin: block only if no payment method AND no active subscription AND subscription expired
      if (!hasPaymentMethod && !hasActiveSubscription && !subscriptionStillValid) {
        return { showPaywall: true, paymentFailed: false, connectionError: false };
      }

      return { showPaywall: false, paymentFailed: false, connectionError: false };
    } catch (err) {
      console.error(`Unexpected error in checkTrialAndPayment (attempt ${retryCount + 1}):`, err);
      
      if (retryCount < MAX_BILLING_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        return checkTrialAndPayment(retryCount + 1);
      }
      
      return { showPaywall: false, paymentFailed: false, connectionError: false };
    }
  }, []);

  const runBillingCheck = useCallback(async () => {
    const result = await checkTrialAndPayment();
    if (isMountedRef.current) {
      setShowPaywall(result.showPaywall);
      setPaymentFailed(result.paymentFailed);
      setConnectionError(result.connectionError);
      setPaywallChecked(true);
      if (result.showPaywall) {
        analytics.trialExpired();
      }
    }
  }, [checkTrialAndPayment]);

  const handleRetry = useCallback(async () => {
    setRetryLoading(true);
    setConnectionError(false);
    setPaywallChecked(false);
    await runBillingCheck();
    setRetryLoading(false);
  }, [runBillingCheck]);

  useEffect(() => {
    isMountedRef.current = true;

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
      
      // Identify user in PostHog
      identifyUser(session.user.id, { email: session.user.email });

      const isGoogle = session.user.app_metadata?.provider === "google";
      const verified = await checkVerificationWithTimeout(session.user.id, isGoogle);

      if (isMountedRef.current) {
        setIsVerified(verified);
      }

      // Only check paywall if verified
      if (verified && isMountedRef.current) {
        await runBillingCheck();
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
        setPaymentFailed(false);
        setConnectionError(false);
        setPaywallChecked(true);
        resetAnalytics();
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
        await runBillingCheck();
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

  // Connection error - show friendly retry screen instead of paywall
  if (connectionError) {
    return <ConnectionErrorScreen onRetry={handleRetry} loading={retryLoading} />;
  }

  // Payment failed - immediate block (admin only)
  if (paymentFailed) {
    return <PaymentFailedPaywall />;
  }

  // Account not activated (admin only)
  if (showPaywall) {
    return <TrialExpiredPaywall />;
  }

  return <>{children}</>;
};
