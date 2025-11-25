import { isNativeApp } from '@/lib/utils';
import { ReactNode } from 'react';

interface NativeLayoutProps {
  children: ReactNode;
}

export const NativeLayout = ({ children }: NativeLayoutProps) => {
  if (!isNativeApp()) {
    // Webb: returnera children direkt utan wrapper
    return <>{children}</>;
  }

  // Native: applicera safe area padding och scroll-hantering
  return (
    <div className="native-layout bg-background pt-[env(safe-area-inset-top)]">
      {children}
    </div>
  );
};
