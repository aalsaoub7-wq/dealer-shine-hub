import { Download, Share, Globe, Smartphone, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PWAInstallButtonProps {
  variant?: "button" | "link";
}

function IOSInstallDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Installera Luvero på iPhone
          </DialogTitle>
        </DialogHeader>
        <ol className="space-y-4 mt-2">
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </span>
            <span className="pt-0.5">
              Öppna <span className="font-semibold">luvero.se</span> i{" "}
              <span className="font-semibold">Safari</span>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              2
            </span>
            <span className="pt-0.5">
              Tryck på{" "}
              <span className="inline-flex items-center gap-1 font-semibold">
                dela-ikonen
                <Share className="h-4 w-4" />
              </span>{" "}
              i verktygsfältet längst ner
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              3
            </span>
            <span className="pt-0.5">
              Scrolla ner och tryck{" "}
              <span className="inline-flex items-center gap-1 font-semibold">
                <Plus className="h-4 w-4" />
                Lägg till på hemskärmen
              </span>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              ✓
            </span>
            <span className="pt-0.5">
              Klart! Appen finns nu på din hemskärm 🎉
            </span>
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}

export function PWAInstallButton({ variant = "button" }: PWAInstallButtonProps) {
  const { canInstall, isIOS, isNative, handleInstall } = usePWAInstall();

  if (isNative) return null;

  // --- Link variant (footer) ---
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
        <IOSInstallDialog>
          <button className="hover:text-foreground transition-colors flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Så installerar du på iPhone
          </button>
        </IOSInstallDialog>
      );
    }
    return (
      <span className="flex items-center gap-2 text-muted-foreground">
        <Globe className="w-4 h-4" />
        <span>Öppna i Chrome för att installera</span>
      </span>
    );
  }

  // --- Button variant (feature section) ---
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
      <IOSInstallDialog>
        <Button size="sm" variant="outline" className="mt-3 gap-2">
          <Smartphone className="h-4 w-4" />
          Så installerar du på iPhone
        </Button>
      </IOSInstallDialog>
    );
  }

  return (
    <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
      <Globe className="h-3.5 w-3.5 shrink-0" />
      Öppna i Chrome för att installera appen
    </p>
  );
}
