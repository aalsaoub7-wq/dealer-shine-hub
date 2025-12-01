import { isNativeApp } from '@/lib/utils';
import { ReactNode, useEffect } from 'react';

interface NativeLayoutProps {
  children: ReactNode;
}

export const NativeLayout = ({ children }: NativeLayoutProps) => {
  useEffect(() => {
    if (!isNativeApp()) return;

    // Trick iOS into recalculating viewport by briefly focusing a hidden password field
    const triggerIOSViewportFix = () => {
      // Create a hidden password input
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'password';
      hiddenInput.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        opacity: 0;
        width: 1px;
        height: 1px;
        pointer-events: none;
      `;
      
      document.body.appendChild(hiddenInput);
      
      // Focus the input to trigger iOS secure text entry mode
      // This forces iOS to recalculate the viewport
      hiddenInput.focus();
      
      // Immediately blur and remove
      setTimeout(() => {
        hiddenInput.blur();
        document.body.removeChild(hiddenInput);
        
        // Additional scroll to ensure layout is settled
        window.scrollTo(0, 0);
      }, 50);
    };

    // Run after a short delay to ensure the app has rendered
    const timeout = setTimeout(triggerIOSViewportFix, 300);

    return () => clearTimeout(timeout);
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
