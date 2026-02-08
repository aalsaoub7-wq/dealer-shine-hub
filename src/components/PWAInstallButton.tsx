import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface PWAInstallButtonProps {
  /** Render as a compact text link instead of a button */
  variant?: "button" | "link";
}

export function PWAInstallButton({ variant = "button" }: PWAInstallButtonProps) {
  const { canInstall, isIOS, isNative, handleInstall } = usePWAInstall();

  if (isNative) return null;

  // Link variant for footer
  if (variant === "link") {
    if (canInstall) {
      return (
        <button
          onClick={handleInstall}
          className="hover:text-foreground transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Installera appen
        </button>
      );
    }
    if (isIOS) {
      return (
        <span className="flex items-center gap-2">
          <Share className="w-4 h-4" />
          <span>
            Dela → <span className="font-medium">Lägg till på hemskärmen</span>
          </span>
        </span>
      );
    }
    return null;
  }

  // Button variant for feature section
  if (canInstall) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="mt-3 gap-2"
        onClick={handleInstall}
      >
        <Download className="h-4 w-4" />
        Installera online
      </Button>
    );
  }

  if (isIOS) {
    return (
      <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
        <Share className="h-3.5 w-3.5 shrink-0" />
        På iPhone: <span className="font-medium">Dela</span> →{" "}
        <span className="font-medium">Lägg till på hemskärmen</span>
      </p>
    );
  }

  return null;
}
