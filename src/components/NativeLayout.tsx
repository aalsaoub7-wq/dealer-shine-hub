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

  // Native: applicera mobil-optimerad layout
  return (
    <div className="native-layout">
      {children}
    </div>
  );
};
