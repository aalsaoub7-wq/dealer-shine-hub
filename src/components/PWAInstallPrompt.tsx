import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

/**
 * Floating update banner only.
 * Install prompts are now handled inline via PWAInstallButton.
 */
export function PWAInstallPrompt() {
  const { isNative, showUpdateBanner, handleUpdate } = usePWAInstall();

  if (isNative || !showUpdateBanner) return null;

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
