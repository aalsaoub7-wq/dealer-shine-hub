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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBlocketSync } from "@/hooks/useBlocketSync";
import { RefreshCw } from "lucide-react";

import blocketLogo from "@/assets/blocket-logo.png";
import facebookMarketplaceLogo from "@/assets/facebook-marketplace-logo.png";
import waykeLogo from "@/assets/wayke-logo.png";
import bytbilLogo from "@/assets/bytbil-logo.png";
import smart365Logo from "@/assets/smart365-logo.png";
import websiteLogo from "@/assets/website-logo.png";
import socialMediaLogo from "@/assets/social-media-logo.webp";

interface Platform {
  id: string;
  name: string;
  logo: string;
  comingSoon?: boolean;
}

const platforms: Platform[] = [
  { id: "blocket", name: "Blocket", logo: blocketLogo },
  { id: "facebook-marketplace", name: "Facebook Marketplace", logo: facebookMarketplaceLogo, comingSoon: true },
  { id: "wayke", name: "Wayke", logo: waykeLogo, comingSoon: true },
  { id: "bytbil", name: "Bytbil", logo: bytbilLogo, comingSoon: true },
  { id: "smart365", name: "Smart365", logo: smart365Logo, comingSoon: true },
  { id: "website", name: "Hemsida", logo: websiteLogo, comingSoon: true },
];

interface PlatformSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  car: any;
  photos: Array<{ id: string; url: string; photo_type: string }>;
}

export function PlatformSyncDialog({ open, onOpenChange, carId, car, photos }: PlatformSyncDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showSocialMediaPicker, setShowSocialMediaPicker] = useState(false);
  const [showBlocketImagePicker, setShowBlocketImagePicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedBlocketImages, setSelectedBlocketImages] = useState<string[]>([]);
  const { isLoading, syncToBlocket, status: blocketStatus } = useBlocketSync(carId);

  const getPlatformStatus = (platformId: string) => {
    if (platformId === "blocket" && blocketStatus) {
      if (blocketStatus.state === "created" && blocketStatus.last_action_state === "success") {
        return { variant: "success" as const, text: "Synkad" };
      }
      if (blocketStatus.last_action_state === "error") {
        return { variant: "destructive" as const, text: "Fel" };
      }
      if (blocketStatus.last_action_state === "pending") {
        return { variant: "warning" as const, text: "Pågående" };
      }
    }
    return null;
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId],
    );
  };

  const selectAll = () => {
    setSelectedPlatforms(platforms.filter((p) => !p.comingSoon).map((p) => p.id));
  };

  const handleSync = async () => {
    if (selectedPlatforms.includes("blocket")) {
      // Show image picker for Blocket
      const mainPhotos = photos?.filter(p => p.photo_type === "main") || [];
      setSelectedBlocketImages(mainPhotos.map(p => p.url));
      setShowBlocketImagePicker(true);
      return;
    }
    // TODO: Implement sync for other platforms
    onOpenChange(false);
  };

  const handleBlocketSync = async () => {
    if (selectedBlocketImages.length === 0) return;
    await syncToBlocket(car, selectedBlocketImages);
    setShowBlocketImagePicker(false);
    setSelectedBlocketImages([]);
    onOpenChange(false);
  };

  const toggleBlocketImage = (imageUrl: string) => {
    setSelectedBlocketImages((prev) =>
      prev.includes(imageUrl) ? prev.filter((url) => url !== imageUrl) : [...prev, imageUrl]
    );
  };

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages((prev) =>
      prev.includes(imageUrl) ? prev.filter((url) => url !== imageUrl) : [...prev, imageUrl]
    );
  };

  const handleSocialMediaShare = () => {
    // TODO: Implement social media sharing logic
    setShowSocialMediaPicker(false);
    setSelectedImages([]);
  };

  if (showBlocketImagePicker) {
    const mainPhotos = photos?.filter(p => p.photo_type === "main") || [];
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-6 w-6 overflow-hidden rounded">
                <img src={blocketLogo} alt="Blocket" className="h-full w-full object-cover scale-200" />
              </div>
              Skicka bilder till Blocket
            </DialogTitle>
            <DialogDescription>Välj vilka bilder du vill skicka (max 38)</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 gap-3 pr-4">
              {mainPhotos.length > 0 ? (
                mainPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                      selectedBlocketImages.includes(photo.url)
                        ? "border-primary shadow-lg"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => toggleBlocketImage(photo.url)}
                  >
                    <img
                      src={photo.url}
                      alt={`Bil bild ${index + 1}`}
                      className="aspect-video w-full rounded-lg object-cover"
                    />
                    {selectedBlocketImages.includes(photo.url) && (
                      <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                        ✓
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex h-[300px] items-center justify-center text-muted-foreground">
                  Inga bilder tillgängliga
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBlocketImagePicker(false);
                setSelectedBlocketImages([]);
              }}
              disabled={isLoading}
            >
              Avbryt
            </Button>
            <Button onClick={handleBlocketSync} disabled={selectedBlocketImages.length === 0 || isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Skickar...
                </>
              ) : (
                `Skicka till Blocket (${selectedBlocketImages.length})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (showSocialMediaPicker) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={socialMediaLogo} alt="Sociala Medier" className="h-6 w-6 object-contain" />
              Dela till Sociala Medier
            </DialogTitle>
            <DialogDescription>Välj vilka bilder du vill dela</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 gap-3 pr-4">
              {photos && photos.length > 0 ? (
                photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                      selectedImages.includes(photo.url)
                        ? "border-primary shadow-lg"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => toggleImageSelection(photo.url)}
                  >
                    <img
                      src={photo.url}
                      alt={`Bil bild ${index + 1}`}
                      className="aspect-video w-full rounded-lg object-cover"
                    />
                    {selectedImages.includes(photo.url) && (
                      <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                        ✓
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex h-[300px] items-center justify-center text-muted-foreground">
                  Inga bilder tillgängliga
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSocialMediaPicker(false);
                setSelectedImages([]);
              }}
            >
              Avbryt
            </Button>
            <Button onClick={handleSocialMediaShare} disabled={selectedImages.length === 0}>
              Dela ({selectedImages.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Synka till plattformar</DialogTitle>
          <DialogDescription>Välj vilka plattformar du vill synka bilen till</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={selectAll} className="flex-1" type="button">
              Välj alla
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowSocialMediaPicker(true)}
              className="flex-1"
              type="button"
            >
              <img src={socialMediaLogo} alt="Sociala Medier" className="mr-2 h-4 w-4 object-contain" />
              Sociala Medier
            </Button>
          </div>

          <ScrollArea className="h-[250px] md:h-[400px]">
            <div className="space-y-3 pr-4">
              {platforms.map((platform) => {
                const status = getPlatformStatus(platform.id);
                return (
                  <div
                    key={platform.id}
                    className={`flex items-center space-x-3 rounded-lg border border-border p-3 transition-colors ${
                      platform.comingSoon ? "opacity-60" : "hover:bg-accent/50"
                    }`}
                  >
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                      disabled={platform.comingSoon}
                    />
{platform.id === "blocket" ? (
  <div className="h-8 w-8 overflow-hidden rounded">
    <img
      src={platform.logo}
      alt={platform.name}
      className="h-full w-full object-cover scale-200"
    />
  </div>
) : (
  <img
    src={platform.logo}
    alt={platform.name}
    className="h-8 w-8 object-contain"
  />
)}
                    <Label 
                      htmlFor={platform.id} 
                      className={`flex-1 ${platform.comingSoon ? "cursor-default" : "cursor-pointer"}`}
                    >
                      {platform.name}
                    </Label>
                    {platform.comingSoon ? (
                      <Badge variant="secondary">Kommer snart</Badge>
                    ) : status ? (
                      <Badge variant={status.variant}>
                        {status.text}
                      </Badge>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1 sm:flex-none">
            Avbryt
          </Button>
          <Button onClick={handleSync} disabled={selectedPlatforms.length === 0 || isLoading} className="flex-1 sm:flex-none">
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
