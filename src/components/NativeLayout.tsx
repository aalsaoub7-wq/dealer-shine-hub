import { isNativeApp } from "@/lib/utils";
import { ReactNode, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

interface NativeLayoutProps {
  children: ReactNode;
}

export const NativeLayout = ({ children }: NativeLayoutProps) => {
  const isNative = isNativeApp();
  const platform = isNative ? Capacitor.getPlatform() : "web";
  const isAndroid = platform === "android";

  useEffect(() => {
    if (!isNative) return;

    if (isAndroid) {
      // Android: försök lägga webview under statusbaren + snygg statusbar
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
  }, [isNative, isAndroid]);

  if (!isNative) {
    return <>{children}</>;
  }

  return (
    <div
      className="native-layout bg-background"
      style={isAndroid ? { paddingTop: 16 } : undefined} // ~16px “safe area” på Android
    >
      {children}
    </div>
  );
};
