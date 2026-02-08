import { useState, useEffect, useCallback } from "react";
import { Download, X, RefreshCw, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isNativeApp } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const isNative = isNativeApp();

  useEffect(() => {
    if (isNative) return;

    // Check if already dismissed this session
    if (sessionStorage.getItem("pwa-install-dismissed")) {
      setDismissed(true);
    }

    // Listen for beforeinstallprompt (Chrome/Edge/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detect iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    if (isIOS && !isInStandaloneMode) {
      setShowIOSHint(true);
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

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setShowInstall(false);
    setShowIOSHint(false);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  }, []);

  const handleUpdate = useCallback(async () => {
    if (updateSW) {
      await updateSW();
      window.location.reload();
    }
  }, [updateSW]);

  // Don't render anything inside Capacitor native app
  if (isNative) return null;

  // Update available banner (top priority)
  if (showUpdateBanner) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in">
        <div className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg">
          <RefreshCw className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Ny version tillgänglig</span>
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto shrink-0"
            onClick={handleUpdate}
          >
            Uppdatera
          </Button>
        </div>
      </div>
    );
  }

  if (dismissed) return null;

  // Chrome/Edge/Android install prompt
  if (showInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in">
        <div className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-3 shadow-lg">
          <Download className="h-5 w-5 shrink-0 text-primary" />
          <span className="text-sm font-medium text-foreground">Installera Luvero-appen</span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={handleInstallClick}>
              Installera
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Stäng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari hint
  if (showIOSHint) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in">
        <div className="flex items-start gap-3 rounded-xl bg-card border border-border px-4 py-3 shadow-lg">
          <Share className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Installera Luvero</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tryck på <span className="font-semibold">Dela</span> → <span className="font-semibold">Lägg till på hemskärmen</span>
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Stäng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
