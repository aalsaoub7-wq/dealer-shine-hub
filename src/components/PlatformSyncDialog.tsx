import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useBlocketSync } from "@/hooks/useBlocketSync";
import { RefreshCw } from "lucide-react";

import blocketLogo from "@/assets/blocket-logo.png";
import waykeLogo from "@/assets/wayke-logo.png";
import bytbilLogo from "@/assets/bytbil-logo.png";
import smart365Logo from "@/assets/smart365-logo.png";
import websiteLogo from "@/assets/website-logo.png";
import socialMediaLogo from "@/assets/social-media-logo.webp";

interface Platform {
  id: string;
  name: string;
  logo: string;
}

const platforms: Platform[] = [
  { id: "blocket", name: "Blocket", logo: blocketLogo },
  { id: "wayke", name: "Wayke", logo: waykeLogo },
  { id: "bytbil", name: "Bytbil", logo: bytbilLogo },
  { id: "smart365", name: "Smart365", logo: smart365Logo },
  { id: "website", name: "Hemsida", logo: websiteLogo },
  { id: "social", name: "Sociala Medier", logo: socialMediaLogo },
];

interface PlatformSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  car: any;
}

export function PlatformSyncDialog({
  open,
  onOpenChange,
  carId,
  car,
}: PlatformSyncDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const { isLoading, syncToBlocket } = useBlocketSync(carId);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const selectAll = () => {
    setSelectedPlatforms(platforms.map((p) => p.id));
  };

  const handleSync = async () => {
    // Currently only Blocket sync is implemented
    if (selectedPlatforms.includes("blocket")) {
      await syncToBlocket(car);
    }
    // TODO: Implement sync for other platforms
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Synka till plattformar</DialogTitle>
          <DialogDescription>
            Välj vilka plattformar du vill synka bilen till
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            variant="outline"
            onClick={selectAll}
            className="w-full"
            type="button"
          >
            Välj alla
          </Button>

          <div className="space-y-3">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={platform.id}
                  checked={selectedPlatforms.includes(platform.id)}
                  onCheckedChange={() => togglePlatform(platform.id)}
                />
                <img
                  src={platform.logo}
                  alt={platform.name}
                  className="h-8 w-8 object-contain"
                />
                <Label
                  htmlFor={platform.id}
                  className="flex-1 cursor-pointer font-medium"
                >
                  {platform.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSync}
            disabled={selectedPlatforms.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Synkar...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Synka
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
