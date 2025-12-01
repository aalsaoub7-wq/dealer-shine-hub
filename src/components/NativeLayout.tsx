import { isNativeApp } from '@/lib/utils';
import { ReactNode, useEffect } from 'react';

interface NativeLayoutProps {
  children: ReactNode;
}

export const NativeLayout = ({ children }: NativeLayoutProps) => {
  useEffect(() => {
    if (!isNativeApp()) return;

    let isFirstActivation = true;

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

    // Listen for app state changes to recalculate when app becomes active
    const setupAppStateListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        const listener = await App.addListener('appStateChange', (state) => {
          if (state.isActive && isFirstActivation) {
            isFirstActivation = false;
            // Run immediately when app becomes active
            forceViewportRecalc();
            // Run again after delays to ensure iOS catches it
            setTimeout(forceViewportRecalc, 100);
            setTimeout(forceViewportRecalc, 300);
            setTimeout(forceViewportRecalc, 500);
          }
        });

        // Also try immediately, in case we mount after app is already active
        setTimeout(forceViewportRecalc, 300);
        setTimeout(forceViewportRecalc, 600);
        setTimeout(forceViewportRecalc, 1000);

        return () => {
          listener.remove();
        };
      } catch (error) {
        console.error('Failed to setup app state listener:', error);
      }
    };

    setupAppStateListener();
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
