import { isNativeApp } from '@/lib/utils';
import { ReactNode, useEffect } from 'react';

interface NativeLayoutProps {
  children: ReactNode;
}

export const NativeLayout = ({ children }: NativeLayoutProps) => {
  useEffect(() => {
    if (!isNativeApp()) return;
    
    const preventOverscroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollContainer = target.closest('.native-layout') as HTMLElement;
      
      if (scrollContainer) {
        const { scrollTop } = scrollContainer;
        
        // Om vi är längst upp och försöker scrolla uppåt, blockera
        if (scrollTop <= 0) {
          const touch = e.touches[0];
          if (touch && scrollContainer.dataset.lastTouchY) {
            const lastY = parseFloat(scrollContainer.dataset.lastTouchY);
            if (touch.clientY > lastY) {
              e.preventDefault();
            }
          }
        }
      }
    };
    
    const recordTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollContainer = target.closest('.native-layout') as HTMLElement;
      if (scrollContainer && e.touches[0]) {
        scrollContainer.dataset.lastTouchY = e.touches[0].clientY.toString();
      }
    };
    
    document.addEventListener('touchstart', recordTouchStart, { passive: true });
    document.addEventListener('touchmove', preventOverscroll, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', recordTouchStart);
      document.removeEventListener('touchmove', preventOverscroll);
    };
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
