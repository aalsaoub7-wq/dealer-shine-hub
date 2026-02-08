import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isNativeApp } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const isPwaStandalone = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
};

export const NativeRouter = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Körs i native app ELLER PWA standalone-läge
    const shouldRedirect = isNativeApp() || isPwaStandalone();

    if (!shouldRedirect) {
      return; // Vanlig webb förblir oförändrad
    }

    // Redirecta från landing page till dashboard (ProtectedRoute hanterar auth)
    if (location.pathname === '/') {
      if (isNativeApp()) {
        // Native: kolla session explicit
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/auth', { replace: true });
          }
        });
      } else {
        // PWA standalone: gå direkt till dashboard, ProtectedRoute redirectar till /auth om ej inloggad
        navigate('/dashboard', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
};
