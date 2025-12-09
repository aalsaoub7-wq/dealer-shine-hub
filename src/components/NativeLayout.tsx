import { isNativeApp } from "@/lib/utils";
import { ReactNode, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

interface NativeLayoutProps {
  children: ReactNode;
}

export const NativeLayout = ({ children }: NativeLayoutProps) => {
  useEffect(() => {
    if (!isNativeApp()) return;

    const platform = Capacitor.getPlatform();

    if (platform === "android") {
      // Android: lägg webview under statusbaren + sätt färg/stil
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      StatusBar.setBackgroundColor({ color: "#050816" }).catch(() => {});
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      return;
    }

    // iOS: behåll ditt befintliga viewport-fix exakt som innan
    const triggerIOSViewportFix = () => {
      const hiddenInput = document.createElement("input");
      hiddenInput.type = "password";
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
      hiddenInput.focus();

      setTimeout(() => {
        hiddenInput.blur();
        document.body.removeChild(hiddenInput);
        window.scrollTo(0, 0);
      }, 50);
    };

    const timeout = setTimeout(triggerIOSViewportFix, 300);
    return () => clearTimeout(timeout);
  }, []);

  if (!isNativeApp()) {
    return <>{children}</>;
  }

  return <div className="native-layout bg-background">{children}</div>;
};
