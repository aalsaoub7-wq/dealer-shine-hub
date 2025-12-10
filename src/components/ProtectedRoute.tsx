import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        setIsVerified(null);
        return;
      }

      setIsAuthenticated(true);

      // Check verification status
      try {
        const { data, error } = await supabase.functions.invoke("get-verification-status", {
          body: { userId: session.user.id },
        });

        if (error) {
          console.error("Error checking verification:", error);
          // If error checking, allow access (fallback)
          setIsVerified(true);
          return;
        }

        // Google users only need phone verification
        const isGoogle = session.user.app_metadata?.provider === "google";
        
        if (isGoogle) {
          setIsVerified(data?.phoneVerified === true);
        } else {
          setIsVerified(data?.emailVerified === true && data?.phoneVerified === true);
        }
      } catch (err) {
        console.error("Error in verification check:", err);
        // Fallback to allow access
        setIsVerified(true);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setIsVerified(null);
        return;
      }

      setIsAuthenticated(true);

      // Check verification status on auth change
      try {
        const { data } = await supabase.functions.invoke("get-verification-status", {
          body: { userId: session.user.id },
        });

        const isGoogle = session.user.app_metadata?.provider === "google";
        
        if (isGoogle) {
          setIsVerified(data?.phoneVerified === true);
        } else {
          setIsVerified(data?.emailVerified === true && data?.phoneVerified === true);
        }
      } catch {
        setIsVerified(true);
      }
    });

    return () => subscription.unsubscribe();
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
