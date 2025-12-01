import { isNativeApp } from '@/lib/utils';
import { ReactNode, useEffect } from 'react';

interface NativeLayoutProps {
  children: ReactNode;
}

export const NativeLayout = ({ children }: NativeLayoutProps) => {
  useEffect(() => {
    if (isNativeApp()) {
      // Aggressive iOS viewport recalculation
      const forceViewportRecalc = () => {
        // Force reflow by manipulating body style
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        void document.body.offsetHeight; // Force reflow
        document.body.style.overflow = originalOverflow;
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Dispatch multiple events
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('orientationchange'));
      };
      
      // Run immediately
      forceViewportRecalc();
      
      // Run multiple times with different delays to ensure iOS catches it
      const timeout1 = setTimeout(forceViewportRecalc, 50);
      const timeout2 = setTimeout(forceViewportRecalc, 150);
      const timeout3 = setTimeout(forceViewportRecalc, 300);
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };
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
