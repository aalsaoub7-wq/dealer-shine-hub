import { isNativeApp } from '@/lib/utils';
import { ReactNode, useEffect } from 'react';

interface NativeLayoutProps {
  children: ReactNode;
}

export const NativeLayout = ({ children }: NativeLayoutProps) => {
  useEffect(() => {
    if (!isNativeApp()) return;

    let hasRecalculated = false;

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

    // Listen for scroll to trigger recalculation
    const handleScroll = () => {
      if (!hasRecalculated) {
        hasRecalculated = true;
        forceViewportRecalc();
        // Remove listener after first scroll
        window.removeEventListener('scroll', handleScroll, true);
        document.removeEventListener('scroll', handleScroll, true);
      }
    };

    // Listen for touch start as an alternative trigger
    const handleTouchStart = () => {
      if (!hasRecalculated) {
        hasRecalculated = true;
        forceViewportRecalc();
        window.removeEventListener('touchstart', handleTouchStart, true);
      }
    };

    // Add listeners with capture to catch all scroll/touch events
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('touchstart', handleTouchStart, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('touchstart', handleTouchStart, true);
    };
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
