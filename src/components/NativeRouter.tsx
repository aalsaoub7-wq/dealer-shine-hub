import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isNativeApp } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export const NativeRouter = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // ENDAST körs i native app
    if (!isNativeApp()) {
      return; // Webb förblir oförändrad
    }

    // I native: redirecta från landing page till auth eller dashboard
    if (location.pathname === '/') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/auth', { replace: true });
        }
      });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
};
