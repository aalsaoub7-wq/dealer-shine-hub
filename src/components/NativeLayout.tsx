import { isNativeApp } from '@/lib/utils';
import { ReactNode, useEffect } from 'react';

interface NativeLayoutProps {
  children: ReactNode;
}

export const NativeLayout = ({ children }: NativeLayoutProps) => {
  // Återställ scroll-position vid mount och efter eventuella viewport-ändringar
  useEffect(() => {
    if (isNativeApp()) {
      // Säkerställ att vi är längst upp
      window.scrollTo(0, 0);
      
      // Lyssna på resize-events (händer när kamera öppnas/stängs)
      const handleResize = () => {
        // Kort delay för att låta iOS stabilisera viewporten
        setTimeout(() => {
          // Återställ #root scroll-position
          const root = document.getElementById('root');
          if (root) {
            root.scrollTop = 0;
          }
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 100);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  if (!isNativeApp()) {
    return <>{children}</>;
  }

  return (
    <div className="native-layout bg-background pt-[env(safe-area-inset-top)]">
      {children}
    </div>
  );
};
