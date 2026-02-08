import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./lib/analytics";
import { isNativeApp } from "./lib/utils";

// Initialize PostHog analytics
initPostHog();

// Register PWA service worker (only in web, not inside Capacitor)
if (!isNativeApp()) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        // Dispatch custom event so PWAInstallPrompt can show update banner
        window.dispatchEvent(
          new CustomEvent("sw-update-available", {
            detail: {
              updateSW: () =>
                registerSW({ immediate: true }),
            },
          })
        );
      },
      onOfflineReady() {
        console.log("Luvero PWA: Ready for offline use");
      },
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
