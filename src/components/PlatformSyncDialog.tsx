import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { useBlocketSync } from "@/hooks/useBlocketSync";
import { useWaykeSync } from "@/hooks/useWaykeSync";

import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Pencil } from "lucide-react";
import { toast } from "sonner";

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
  { id: "wayke", name: "Wayke", logo: waykeLogo },
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

interface AiSettingsCredentials {
  blocket_api_token?: string | null;
  blocket_dealer_code?: string | null;
  blocket_dealer_name?: string | null;
  blocket_dealer_phone?: string | null;
  blocket_dealer_email?: string | null;
  wayke_client_id?: string | null;
  wayke_client_secret?: string | null;
  wayke_branch_id?: string | null;
}

export function PlatformSyncDialog({ open, onOpenChange, carId, car, photos }: PlatformSyncDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showSocialMediaPicker, setShowSocialMediaPicker] = useState(false);
  const [showBlocketImagePicker, setShowBlocketImagePicker] = useState(false);
  const [showWaykeImagePicker, setShowWaykeImagePicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedBlocketImages, setSelectedBlocketImages] = useState<string[]>([]);
  const [selectedWaykeImages, setSelectedWaykeImages] = useState<string[]>([]);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const { isLoading: blocketLoading, syncToBlocket, status: blocketStatus } = useBlocketSync(carId);
  const { isLoading: waykeLoading, syncToWayke, status: waykeStatus } = useWaykeSync(carId);

  // Credentials state
  const [credentials, setCredentials] = useState<AiSettingsCredentials | null>(null);
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [showBlocketSetup, setShowBlocketSetup] = useState(false);
  const [showWaykeSetup, setShowWaykeSetup] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);

  // Setup form state
  const [blocketForm, setBlocketForm] = useState({
    blocket_api_token: "",
    blocket_dealer_code: "",
    blocket_dealer_name: "",
    blocket_dealer_phone: "",
    blocket_dealer_email: "",
  });
  const [waykeForm, setWaykeForm] = useState({
    wayke_client_id: "",
    wayke_client_secret: "",
    wayke_branch_id: "",
  });

  const isLoading = blocketLoading || waykeLoading;

  // Fetch credentials on open
  useEffect(() => {
    if (open && car?.company_id) {
      setCredentialsLoaded(false);
      supabase
        .from("ai_settings")
        .select("blocket_api_token, blocket_dealer_code, blocket_dealer_name, blocket_dealer_phone, blocket_dealer_email, wayke_client_id, wayke_client_secret, wayke_branch_id")
        .eq("company_id", car.company_id)
        .maybeSingle()
        .then(({ data }) => {
          setCredentials(data as AiSettingsCredentials | null);
          setCredentialsLoaded(true);
        });
    }
  }, [open, car?.company_id]);

  const handleImageLoad = (url: string) => {
    setLoadedImages((prev) => new Set(prev).add(url));
  };

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
    if (platformId === "wayke" && waykeStatus) {
      if (waykeStatus.state === "created" && (waykeStatus.last_action_state === "success" || waykeStatus.last_action_state === "done")) {
        return { variant: "success" as const, text: "Synkad" };
      }
      if (waykeStatus.last_action_state === "error") {
        return { variant: "destructive" as const, text: "Fel" };
      }
      if (waykeStatus.last_action_state === "processing") {
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

  const hasBlocketCredentials = () => {
    return credentials?.blocket_api_token && credentials?.blocket_dealer_code;
  };

  const hasWaykeCredentials = () => {
    return credentials?.wayke_client_id && credentials?.wayke_client_secret && credentials?.wayke_branch_id;
  };

  const saveBlocketCredentials = async () => {
    if (!blocketForm.blocket_api_token || !blocketForm.blocket_dealer_code) {
      toast.error("API-token och dealer-kod krävs");
      return;
    }
    setSavingCredentials(true);
    try {
      const { error } = await supabase
        .from("ai_settings")
        .update({
          blocket_api_token: blocketForm.blocket_api_token,
          blocket_dealer_code: blocketForm.blocket_dealer_code,
          blocket_dealer_name: blocketForm.blocket_dealer_name || null,
          blocket_dealer_phone: blocketForm.blocket_dealer_phone || null,
          blocket_dealer_email: blocketForm.blocket_dealer_email || null,
        })
        .eq("company_id", car.company_id);

      if (error) throw error;

      setCredentials(prev => ({
        ...prev,
        ...blocketForm,
      }));
      setShowBlocketSetup(false);
      toast.success("Blocket-uppgifter sparade!");
      // Now proceed to image picker
      const mainPhotos = photos?.filter(p => p.photo_type === "main") || [];
      setSelectedBlocketImages(mainPhotos.map(p => p.url));
      setShowBlocketImagePicker(true);
    } catch (e: any) {
      toast.error("Kunde inte spara: " + e.message);
    } finally {
      setSavingCredentials(false);
    }
  };

  const saveWaykeCredentials = async () => {
    if (!waykeForm.wayke_client_id || !waykeForm.wayke_client_secret || !waykeForm.wayke_branch_id) {
      toast.error("Alla fält krävs");
      return;
    }
    setSavingCredentials(true);
    try {
      const { error } = await supabase
        .from("ai_settings")
        .update({
          wayke_client_id: waykeForm.wayke_client_id,
          wayke_client_secret: waykeForm.wayke_client_secret,
          wayke_branch_id: waykeForm.wayke_branch_id,
        })
        .eq("company_id", car.company_id);

      if (error) throw error;

      setCredentials(prev => ({
        ...prev,
        ...waykeForm,
      }));
      setShowWaykeSetup(false);
      toast.success("Wayke-uppgifter sparade!");
      // Now proceed to image picker
      const mainPhotos = photos?.filter(p => p.photo_type === "main") || [];
      setSelectedWaykeImages(mainPhotos.map(p => p.url));
      setShowWaykeImagePicker(true);
    } catch (e: any) {
      toast.error("Kunde inte spara: " + e.message);
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleSync = async () => {
    if (selectedPlatforms.includes("blocket")) {
      if (!hasBlocketCredentials()) {
        setShowBlocketSetup(true);
        return;
      }
      const mainPhotos = photos?.filter(p => p.photo_type === "main") || [];
      setSelectedBlocketImages(mainPhotos.map(p => p.url));
      setShowBlocketImagePicker(true);
      return;
    }
    if (selectedPlatforms.includes("wayke")) {
      if (!hasWaykeCredentials()) {
        setShowWaykeSetup(true);
        return;
      }
      const mainPhotos = photos?.filter(p => p.photo_type === "main") || [];
      setSelectedWaykeImages(mainPhotos.map(p => p.url));
      setShowWaykeImagePicker(true);
      return;
    }
    onOpenChange(false);
  };

  const handleBlocketSync = async () => {
    if (selectedBlocketImages.length === 0) return;
    await syncToBlocket(car, selectedBlocketImages);
    setShowBlocketImagePicker(false);
    setSelectedBlocketImages([]);
    // If Wayke is also selected, show Wayke picker next
    if (selectedPlatforms.includes("wayke")) {
      if (!hasWaykeCredentials()) {
        setShowWaykeSetup(true);
      } else {
        const mainPhotos = photos?.filter(p => p.photo_type === "main") || [];
        setSelectedWaykeImages(mainPhotos.map(p => p.url));
        setShowWaykeImagePicker(true);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleWaykeSync = async () => {
    if (selectedWaykeImages.length === 0) return;
    await syncToWayke(car, selectedWaykeImages);
    setShowWaykeImagePicker(false);
    setSelectedWaykeImages([]);
    onOpenChange(false);
  };

  const toggleBlocketImage = (imageUrl: string) => {
    setSelectedBlocketImages((prev) =>
      prev.includes(imageUrl) ? prev.filter((url) => url !== imageUrl) : [...prev, imageUrl]
    );
  };

  const toggleWaykeImage = (imageUrl: string) => {
    setSelectedWaykeImages((prev) =>
      prev.includes(imageUrl) ? prev.filter((url) => url !== imageUrl) : [...prev, imageUrl]
    );
  };

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages((prev) =>
      prev.includes(imageUrl) ? prev.filter((url) => url !== imageUrl) : [...prev, imageUrl]
    );
  };

  const handleSocialMediaShare = () => {
    setShowSocialMediaPicker(false);
    setSelectedImages([]);
  };

  // Reusable image picker renderer
  const renderImagePicker = (
    selectedImagesList: string[],
    toggleImage: (url: string) => void,
    filterType: "main" | "all" = "main"
  ) => {
    const filteredPhotos = filterType === "main"
      ? (photos?.filter(p => p.photo_type === "main") || [])
      : (photos || []);

    return (
      <div className="grid grid-cols-2 gap-3 pr-4">
        {filteredPhotos.length > 0 ? (
          filteredPhotos.map((photo, index) => {
            return (
              <div
                key={photo.id}
                className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                  selectedImagesList.includes(photo.url)
                    ? "border-primary shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => toggleImage(photo.url)}
              >
                <img
                  src={photo.url}
                  alt={`Bil bild ${index + 1}`}
                  className={`aspect-video w-full rounded-lg object-cover transition-opacity duration-300 ${
                    loadedImages.has(photo.url) ? "opacity-100" : "opacity-0"
                  }`}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => handleImageLoad(photo.url)}
                />
                {!loadedImages.has(photo.url) && (
                  <div className="aspect-video w-full rounded-lg bg-muted animate-pulse" />
                )}
                {selectedImagesList.includes(photo.url) && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    ✓
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-2 flex h-[300px] items-center justify-center text-muted-foreground">
            Inga bilder tillgängliga
          </div>
        )}
      </div>
    );
  };

  // Blocket setup form
  if (showBlocketSetup) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-6 w-6 overflow-hidden rounded">
                <img src={blocketLogo} alt="Blocket" className="h-full w-full object-cover scale-200" />
              </div>
              Konfigurera Blocket
            </DialogTitle>
            <DialogDescription>
              Ange dina Blocket-uppgifter. Du behöver bara göra detta en gång. Kontakta Blockets butikssupport (butikssupport@blocket.se) för att få din API-token och dealer-kod.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="blocket_api_token">API-token *</Label>
              <Input
                id="blocket_api_token"
                type="password"
                placeholder="Din Blocket API-token"
                value={blocketForm.blocket_api_token}
                onChange={(e) => setBlocketForm(f => ({ ...f, blocket_api_token: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blocket_dealer_code">Dealer-kod *</Label>
              <Input
                id="blocket_dealer_code"
                placeholder="T.ex. DEMO_DEALER"
                value={blocketForm.blocket_dealer_code}
                onChange={(e) => setBlocketForm(f => ({ ...f, blocket_dealer_code: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blocket_dealer_name">Kontaktnamn</Label>
              <Input
                id="blocket_dealer_name"
                placeholder="Ditt namn"
                value={blocketForm.blocket_dealer_name}
                onChange={(e) => setBlocketForm(f => ({ ...f, blocket_dealer_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blocket_dealer_phone">Telefon</Label>
              <Input
                id="blocket_dealer_phone"
                placeholder="0700000000"
                value={blocketForm.blocket_dealer_phone}
                onChange={(e) => setBlocketForm(f => ({ ...f, blocket_dealer_phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blocket_dealer_email">E-post</Label>
              <Input
                id="blocket_dealer_email"
                type="email"
                placeholder="info@example.com"
                value={blocketForm.blocket_dealer_email}
                onChange={(e) => setBlocketForm(f => ({ ...f, blocket_dealer_email: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlocketSetup(false)} disabled={savingCredentials}>
              Avbryt
            </Button>
            <Button onClick={saveBlocketCredentials} disabled={savingCredentials}>
              {savingCredentials ? "Sparar..." : "Spara och fortsätt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Wayke setup form
  if (showWaykeSetup) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={waykeLogo} alt="Wayke" className="h-6 w-6 object-contain" />
              Konfigurera Wayke
            </DialogTitle>
            <DialogDescription>
              Ange dina Wayke-uppgifter. Du behöver bara göra detta en gång. Kontakta info@wayke.se för att få dina uppgifter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wayke_client_id">Client ID *</Label>
              <Input
                id="wayke_client_id"
                placeholder="Din Wayke Client ID"
                value={waykeForm.wayke_client_id}
                onChange={(e) => setWaykeForm(f => ({ ...f, wayke_client_id: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wayke_client_secret">Client Secret *</Label>
              <Input
                id="wayke_client_secret"
                type="password"
                placeholder="Din Wayke Client Secret"
                value={waykeForm.wayke_client_secret}
                onChange={(e) => setWaykeForm(f => ({ ...f, wayke_client_secret: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wayke_branch_id">Branch ID *</Label>
              <Input
                id="wayke_branch_id"
                placeholder="UUID för din branch"
                value={waykeForm.wayke_branch_id}
                onChange={(e) => setWaykeForm(f => ({ ...f, wayke_branch_id: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWaykeSetup(false)} disabled={savingCredentials}>
              Avbryt
            </Button>
            <Button onClick={saveWaykeCredentials} disabled={savingCredentials}>
              {savingCredentials ? "Sparar..." : "Spara och fortsätt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (showBlocketImagePicker) {
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
            {renderImagePicker(selectedBlocketImages, toggleBlocketImage)}
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
              {blocketLoading ? (
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

  if (showWaykeImagePicker) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={waykeLogo} alt="Wayke" className="h-6 w-6 object-contain" />
              Skicka bilder till Wayke
            </DialogTitle>
            <DialogDescription>Välj vilka bilder du vill skicka</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px]">
            {renderImagePicker(selectedWaykeImages, toggleWaykeImage)}
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowWaykeImagePicker(false);
                setSelectedWaykeImages([]);
              }}
              disabled={isLoading}
            >
              Avbryt
            </Button>
            <Button onClick={handleWaykeSync} disabled={selectedWaykeImages.length === 0 || isLoading}>
              {waykeLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Skickar...
                </>
              ) : (
                `Skicka till Wayke (${selectedWaykeImages.length})`
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
            {renderImagePicker(selectedImages, toggleImageSelection, "all")}
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
                    {platform.id === "blocket" && hasBlocketCredentials() && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBlocketForm({
                            blocket_api_token: credentials?.blocket_api_token || "",
                            blocket_dealer_code: credentials?.blocket_dealer_code || "",
                            blocket_dealer_name: credentials?.blocket_dealer_name || "",
                            blocket_dealer_phone: credentials?.blocket_dealer_phone || "",
                            blocket_dealer_email: credentials?.blocket_dealer_email || "",
                          });
                          setShowBlocketSetup(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {platform.id === "wayke" && hasWaykeCredentials() && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWaykeForm({
                            wayke_client_id: credentials?.wayke_client_id || "",
                            wayke_client_secret: credentials?.wayke_client_secret || "",
                            wayke_branch_id: credentials?.wayke_branch_id || "",
                          });
                          setShowWaykeSetup(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
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
