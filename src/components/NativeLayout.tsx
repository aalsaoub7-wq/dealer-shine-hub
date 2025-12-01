import { isNativeApp } from '@/lib/utils';
import { ReactNode, useEffect } from 'react';

interface NativeLayoutProps {
  children: ReactNode;
}

export const NativeLayout = ({ children }: NativeLayoutProps) => {
  useEffect(() => {
    if (isNativeApp()) {
      // Force iOS viewport recalculation
      const forceViewportRecalc = () => {
        window.scrollTo(0, 0);
        window.dispatchEvent(new Event('resize'));
      };
      
      // Run immediately
      forceViewportRecalc();
      
      // Also run after a short delay to ensure iOS has rendered
      const timeout = setTimeout(forceViewportRecalc, 100);
      
      return () => clearTimeout(timeout);
    }
  }, []);

  if (!isNativeApp()) {
    return <>{children}</>;
  }

  return (
    <div className="native-layout bg-background">
      {children}
    </div>
  );
};
