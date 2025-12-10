import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const VERIFICATION_TIMEOUT_MS = 3000;

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const isMountedRef = useRef(true);

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

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMountedRef.current) return;

      if (!session) {
        setIsAuthenticated(false);
        setIsVerified(null);
        return;
      }

      setIsAuthenticated(true);

      const isGoogle = session.user.app_metadata?.provider === "google";
      const verified = await checkVerificationWithTimeout(session.user.id, isGoogle);

      if (isMountedRef.current) {
        setIsVerified(verified);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMountedRef.current) return;

      if (!session) {
        setIsAuthenticated(false);
        setIsVerified(null);
        return;
      }

      setIsAuthenticated(true);

      const isGoogle = session.user.app_metadata?.provider === "google";
      const verified = await checkVerificationWithTimeout(session.user.id, isGoogle);

      if (isMountedRef.current) {
        setIsVerified(verified);
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Loading state
  if (isAuthenticated === null || (isAuthenticated && isVerified === null)) {
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

  return <>{children}</>;
};
