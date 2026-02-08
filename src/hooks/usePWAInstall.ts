import { useState, useEffect, useCallback } from "react";
import { isNativeApp } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);
  const isNative = isNativeApp();

  useEffect(() => {
    if (isNative) return;

    // Listen for beforeinstallprompt (Chrome/Edge/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detect iOS Safari (not in standalone mode)
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isIOSDevice && !isInStandaloneMode) {
      setIsIOS(true);
    }

    // Listen for SW update from vite-plugin-pwa
    const handleSWUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.updateSW) {
        setUpdateSW(() => detail.updateSW);
        setShowUpdateBanner(true);
      }
    };
    window.addEventListener("sw-update-available", handleSWUpdate);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("sw-update-available", handleSWUpdate);
    };
  }, [isNative]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleUpdate = useCallback(async () => {
    if (updateSW) {
      await updateSW();
      window.location.reload();
    }
  }, [updateSW]);

  return {
    canInstall,
    isIOS,
    isNative,
    handleInstall,
    showUpdateBanner,
    handleUpdate,
  };
}
