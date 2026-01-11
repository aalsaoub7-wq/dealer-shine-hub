import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings, X, Palette, Stamp, Globe, CreditCard, Users, Check, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isNativeApp } from "@/lib/utils";
import { openExternalUrl } from "@/lib/nativeCapabilities";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WatermarkPreview } from "./WatermarkPreview";
import { LandingPagePreview } from "./LandingPagePreview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PaymentSettings } from "./PaymentSettings";
import { TeamManagement } from "./TeamManagement";
import { AccountSettings } from "./AccountSettings";
import { useQuery } from "@tanstack/react-query";
import { CustomStudioDialog } from "./CustomStudioDialog";

// Static background templates with optimized thumbnails
const STATIC_BACKGROUNDS: Array<{
  id: string;
  name: string;
  description: string;
  image?: string;
  thumbnail?: string;
  isCustom?: boolean;
}> = [{
  id: 'curved-studio',
  name: 'Böjd Studio',
  description: 'Mjukt böjd vägg',
  image: '/backgrounds/curved-studio.jpg',
  thumbnail: '/backgrounds/thumbnails/curved-studio-thumb.jpg'
}, {
  id: 'ceiling-lights',
  name: 'Taklampor',
  description: 'Studio med taklampor',
  image: '/backgrounds/ceiling-lights.jpg',
  thumbnail: '/backgrounds/thumbnails/ceiling-lights-thumb.jpg'
}, {
  id: 'dark-studio',
  name: 'Mörk Studio',
  description: 'Helt mörk miljö',
  image: '/backgrounds/dark-studio.jpg',
  thumbnail: '/backgrounds/thumbnails/dark-studio-thumb.jpg'
}, {
  id: 'dark-walls-light-floor',
  name: 'Mörka Väggar',
  description: 'Mörka väggar, ljust golv',
  image: '/backgrounds/dark-walls-light-floor.jpg',
  thumbnail: '/backgrounds/thumbnails/dark-walls-light-floor-thumb.jpg'
}, {
  id: 'gallery',
  name: 'Galleri',
  description: 'Galleri-stil med paneler',
  image: '/backgrounds/gallery.jpg',
  thumbnail: '/backgrounds/thumbnails/gallery-thumb.jpg'
}, {
  id: 'panel-wall',
  name: 'Panelvägg',
  description: 'Rak panelvägg',
  image: '/backgrounds/panel-wall.jpg',
  thumbnail: '/backgrounds/thumbnails/panel-wall-thumb.jpg'
}, {
  id: 'custom-studio',
  name: 'Custom Studio',
  description: 'Skräddarsydd studio',
  isCustom: true
}];
export const AiSettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("background");
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>("studio-background");
  const [exampleDescriptions, setExampleDescriptions] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [watermarkX, setWatermarkX] = useState(20);
  const [watermarkY, setWatermarkY] = useState(20);
  const [watermarkSize, setWatermarkSize] = useState(15);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.8);
  const [landingPageLogoUrl, setLandingPageLogoUrl] = useState("");
  const [landingPageBackgroundColor, setLandingPageBackgroundColor] = useState("#ffffff");
  const [landingPageLayout, setLandingPageLayout] = useState<"grid" | "carousel" | "masonry">("grid");
  const [landingPageHeaderImageUrl, setLandingPageHeaderImageUrl] = useState("");
  const [landingPageTextColor, setLandingPageTextColor] = useState("#000000");
  const [landingPageAccentColor, setLandingPageAccentColor] = useState("#000000");
  const [landingPageTitle, setLandingPageTitle] = useState("Mina Bilder");
  const [landingPageDescription, setLandingPageDescription] = useState("");
  const [landingPageFooterText, setLandingPageFooterText] = useState("");
  const [landingPageLogoSize, setLandingPageLogoSize] = useState<"small" | "medium" | "large">("medium");
  const [landingPageLogoPosition, setLandingPageLogoPosition] = useState<"left" | "center" | "right">("center");
  const [landingPageHeaderHeight, setLandingPageHeaderHeight] = useState<"small" | "medium" | "large">("medium");
  const [landingPageHeaderFit, setLandingPageHeaderFit] = useState<"cover" | "contain" | "fill">("cover");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingLandingLogo, setUploadingLandingLogo] = useState(false);
  const [removingLandingLogoBg, setRemovingLandingLogoBg] = useState(false);
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removingLogoBg, setRemovingLogoBg] = useState(false);
  const [customStudioDialogOpen, setCustomStudioDialogOpen] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    data: userRole
  } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const {
        data
      } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
      return data?.role;
    }
  });
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);
  const loadSettings = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data: companyData
      } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id).single();
      if (!companyData) return;
      const {
        data,
        error
      } = await supabase.from("ai_settings").select("background_template_id, example_descriptions, logo_url, watermark_x, watermark_y, watermark_size, watermark_opacity, landing_page_logo_url, landing_page_background_color, landing_page_layout, landing_page_header_image_url, landing_page_text_color, landing_page_accent_color, landing_page_title, landing_page_description, landing_page_footer_text, landing_page_logo_size, landing_page_logo_position, landing_page_header_height, landing_page_header_fit").eq("company_id", companyData.company_id).single();
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      if (data) {
        const savedTemplateId = data.background_template_id;
        if (savedTemplateId) {
          const matchingBg = STATIC_BACKGROUNDS.find(bg => bg.id === savedTemplateId);
          if (matchingBg) {
            setSelectedBackgroundId(savedTemplateId);
          } else {
            setSelectedBackgroundId("studio-background");
          }
        }
        setExampleDescriptions(data.example_descriptions || "");
        setLogoUrl(data.logo_url || "");
        setWatermarkX(data.watermark_x || 20);
        setWatermarkY(data.watermark_y || 20);
        setWatermarkSize(data.watermark_size || 15);
        setWatermarkOpacity(data.watermark_opacity || 0.8);
        setLandingPageLogoUrl(data.landing_page_logo_url || "");
        setLandingPageBackgroundColor(data.landing_page_background_color || "#ffffff");
        setLandingPageLayout(data.landing_page_layout as "grid" | "carousel" | "masonry" || "grid");
        setLandingPageHeaderImageUrl(data.landing_page_header_image_url || "");
        setLandingPageTextColor(data.landing_page_text_color || "#000000");
        setLandingPageAccentColor(data.landing_page_accent_color || "#000000");
        setLandingPageTitle(data.landing_page_title || "Mina Bilder");
        setLandingPageDescription(data.landing_page_description || "");
        setLandingPageFooterText(data.landing_page_footer_text || "");
        setLandingPageLogoSize(data.landing_page_logo_size as "small" | "medium" | "large" || "medium");
        setLandingPageLogoPosition(data.landing_page_logo_position as "left" | "center" | "right" || "center");
        setLandingPageHeaderHeight(data.landing_page_header_height as "small" | "medium" | "large" || "medium");
        setLandingPageHeaderFit(data.landing_page_header_fit as "cover" | "contain" | "fill" || "cover");
      }
    } catch (error: any) {
      console.error("Error loading AI settings:", error);
      toast({
        title: "Fel vid laddning av inställningar",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Inte inloggad");
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from("car-photos").upload(filePath, file, {
        upsert: true
      });
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from("car-photos").getPublicUrl(filePath);
      setLogoUrl(publicUrl);
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Fel vid uppladdning",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(false);
    }
  };
  const handleRemoveLogo = () => {
    setLogoUrl("");
  };
  const handleRemoveLogoBackground = async () => {
    if (!logoUrl) return;
    setRemovingLogoBg(true);
    try {
      const response = await supabase.functions.invoke('remove-logo-background', {
        body: {
          imageUrl: logoUrl
        }
      });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      setLogoUrl(response.data.newUrl);
    } catch (error: any) {
      console.error("Error removing logo background:", error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort bakgrunden: " + error.message,
        variant: "destructive"
      });
    } finally {
      setRemovingLogoBg(false);
    }
  };
  const handleRemoveLandingLogoBackground = async () => {
    if (!landingPageLogoUrl) return;
    setRemovingLandingLogoBg(true);
    try {
      const response = await supabase.functions.invoke('remove-logo-background', {
        body: {
          imageUrl: landingPageLogoUrl
        }
      });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      setLandingPageLogoUrl(response.data.newUrl);
    } catch (error: any) {
      console.error("Error removing landing logo background:", error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort bakgrunden: " + error.message,
        variant: "destructive"
      });
    } finally {
      setRemovingLandingLogoBg(false);
    }
  };
  const handleLandingLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingLandingLogo(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Inte inloggad");
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-landing-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from("car-photos").upload(filePath, file, {
        upsert: true
      });
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from("car-photos").getPublicUrl(filePath);
      setLandingPageLogoUrl(publicUrl);
    } catch (error: any) {
      console.error("Error uploading landing logo:", error);
      toast({
        title: "Fel vid uppladdning",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingLandingLogo(false);
    }
  };
  const handleHeaderImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingHeaderImage(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Inte inloggad");
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-header-${Date.now()}.${fileExt}`;
      const filePath = `headers/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from("car-photos").upload(filePath, file, {
        upsert: true
      });
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from("car-photos").getPublicUrl(filePath);
      setLandingPageHeaderImageUrl(publicUrl);
    } catch (error: any) {
      console.error("Error uploading header image:", error);
      toast({
        title: "Fel vid uppladdning",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingHeaderImage(false);
    }
  };
  const saveSettings = async () => {
    setLoading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Inte inloggad");
      const {
        data: companyData
      } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id).single();
      if (!companyData) throw new Error("Kunde inte hitta företag");
      const {
        error
      } = await supabase.from("ai_settings").upsert({
        user_id: user.id,
        company_id: companyData.company_id,
        background_template_id: selectedBackgroundId,
        example_descriptions: exampleDescriptions,
        logo_url: logoUrl,
        watermark_x: watermarkX,
        watermark_y: watermarkY,
        watermark_size: watermarkSize,
        watermark_opacity: watermarkOpacity,
        landing_page_logo_url: landingPageLogoUrl,
        landing_page_background_color: landingPageBackgroundColor,
        landing_page_layout: landingPageLayout,
        landing_page_header_image_url: landingPageHeaderImageUrl,
        landing_page_text_color: landingPageTextColor,
        landing_page_accent_color: landingPageAccentColor,
        landing_page_title: landingPageTitle,
        landing_page_description: landingPageDescription,
        landing_page_footer_text: landingPageFooterText,
        landing_page_logo_size: landingPageLogoSize,
        landing_page_logo_position: landingPageLogoPosition,
        landing_page_header_height: landingPageHeaderHeight,
        landing_page_header_fit: landingPageHeaderFit
      }, {
        onConflict: "company_id"
      });
      if (error) throw error;
      setOpen(false);
    } catch (error: any) {
      console.error("Error saving AI settings:", error);
      toast({
        title: "Fel vid sparande",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Expose function for external access
  useEffect(() => {
    (window as any).openSettingsDialog = (tab?: string) => {
      if (tab) setCurrentTab(tab);
      setOpen(true);
    };
    return () => {
      delete (window as any).openSettingsDialog;
    };
  }, []);
  const handleGuideClick = async () => {
    if (isNativeApp()) {
      await openExternalUrl("https://luvero.se/guide");
    } else {
      navigate("/guide");
    }
  };
  return <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={handleGuideClick}>
        <span className="text-lg font-bold">?</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Inställningar</DialogTitle>
          </DialogHeader>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className={`grid w-full overflow-hidden ${userRole === "admin" ? "grid-cols-6" : "grid-cols-4"}`}>
              <TabsTrigger value="background" className="flex items-center justify-center">
                <Palette className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="watermark" className="flex items-center justify-center">
                <Stamp className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="landing" className="flex items-center justify-center">
                <Globe className="h-4 w-4" />
              </TabsTrigger>
              {userRole === "admin" && <>
                  <TabsTrigger value="payment" className="flex items-center justify-center">
                    <CreditCard className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </TabsTrigger>
                </>}
              <TabsTrigger value="account" className="flex items-center justify-center">
                <User className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="background" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Välj bakgrundsmall</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Välj en av våra fördefinierade bakgrunder för dina bilfoton
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STATIC_BACKGROUNDS.map(bg => <div key={bg.id} className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-primary ${selectedBackgroundId === bg.id && !bg.isCustom ? "border-primary bg-primary/5" : "border-border"} ${bg.isCustom ? "border-dashed" : ""}`} onClick={() => {
                  if (bg.isCustom) {
                    setCustomStudioDialogOpen(true);
                  } else {
                    setSelectedBackgroundId(bg.id);
                  }
                }}>
                      {bg.isCustom ? <div className="aspect-video mb-2 overflow-hidden rounded-md bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">Få din egna studio </span>
                        </div> : <div className="aspect-video mb-2 overflow-hidden rounded-md bg-muted">
                          <img src={bg.thumbnail} alt={bg.name} className="h-full w-full object-cover" loading="eager" decoding="async" />
                        </div>}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{bg.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {bg.isCustom ? "Från 299 kr" : bg.description}
                          </p>
                        </div>
                        {selectedBackgroundId === bg.id && !bg.isCustom && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                      </div>
                    </div>)}
                </div>

                <CustomStudioDialog open={customStudioDialogOpen} onOpenChange={setCustomStudioDialogOpen} />
              </div>
            </TabsContent>

            <TabsContent value="watermark" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="logo-upload" className="text-base font-semibold">
                    Vattenmärke logotyp
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Ladda upp en logotyp som kommer att läggas till på dina redigerade bilder
                  </p>

                  {logoUrl ? <div className="flex flex-wrap items-center gap-2 p-2 border rounded-lg bg-muted/30">
                      <img src={logoUrl} alt="Logo" className="h-10 w-auto max-w-[80px] object-contain" />
                      <Button variant="outline" size="sm" onClick={handleRemoveLogoBackground} disabled={removingLogoBg} className="text-xs px-2 h-8">
                        {removingLogoBg ? "..." : "Ta bort bg"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleRemoveLogo} className="text-xs px-2 h-8">
                        <X className="h-3 w-3 mr-1" />
                        Ta bort
                      </Button>
                    </div> : <div className="flex items-center gap-2">
                      <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="max-w-[250px] text-base" />
                      {uploadingLogo && <span className="text-sm text-muted-foreground">Laddar upp...</span>}
                    </div>}
                </div>

                {logoUrl && <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Transparens ({Math.round(watermarkOpacity * 100)}%)</Label>
                      <input type="range" min="0" max="100" value={Math.round(watermarkOpacity * 100)} onChange={e => setWatermarkOpacity(Number(e.target.value) / 100)} className="w-full" />
                    </div>
                    <div className="mt-4">
                      <Label className="text-base font-semibold mb-3 block">Förhandsgranskning</Label>
                      <WatermarkPreview logoUrl={logoUrl} x={watermarkX} y={watermarkY} size={watermarkSize} opacity={watermarkOpacity} onPositionChange={(newX, newY) => {
                    setWatermarkX(newX);
                    setWatermarkY(newY);
                  }} onSizeChange={setWatermarkSize} />
                    </div>
                  </>}
              </div>
            </TabsContent>

            <TabsContent value="landing" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Landningssida för delning</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Anpassa hur din delade bildsamling visas
                  </p>
                </div>

                {/* Logo upload */}
                <div className="space-y-2">
                  <Label htmlFor="landing-logo-upload">Logotyp</Label>
                  {landingPageLogoUrl ? <div className="flex flex-wrap items-center gap-2 p-2 border rounded-lg bg-muted/30">
                      <img src={landingPageLogoUrl} alt="Logo" className="h-10 w-auto max-w-[80px] object-contain" />
                      <Button variant="outline" size="sm" onClick={handleRemoveLandingLogoBackground} disabled={removingLandingLogoBg} className="text-xs px-2 h-8">
                        {removingLandingLogoBg ? "..." : "Ta bort bg"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setLandingPageLogoUrl("")} className="text-xs px-2 h-8">
                        <X className="h-3 w-3 mr-1" />
                        Ta bort
                      </Button>
                    </div> : <Input id="landing-logo-upload" type="file" accept="image/*" onChange={handleLandingLogoUpload} disabled={uploadingLandingLogo} className="text-base" />}
                </div>

                {/* Logo size and position */}
                {landingPageLogoUrl && <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Logotypstorlek</Label>
                      <Select value={landingPageLogoSize} onValueChange={(v: "small" | "medium" | "large") => setLandingPageLogoSize(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Liten</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Stor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Logotypposition</Label>
                      <Select value={landingPageLogoPosition} onValueChange={(v: "left" | "center" | "right") => setLandingPageLogoPosition(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Vänster</SelectItem>
                          <SelectItem value="center">Centrerad</SelectItem>
                          <SelectItem value="right">Höger</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>}

                {/* Header image upload */}
                <div className="space-y-2">
                  <Label htmlFor="header-image-upload">Header-bild</Label>
                  {landingPageHeaderImageUrl ? <div className="space-y-2">
                      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border">
                        <img src={landingPageHeaderImageUrl} alt="Header" className="h-full w-full object-cover" />
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => setLandingPageHeaderImageUrl("")}>
                        <X className="h-4 w-4 mr-1" />
                        Ta bort
                      </Button>
                    </div> : <Input id="header-image-upload" type="file" accept="image/*" onChange={handleHeaderImageUpload} disabled={uploadingHeaderImage} className="text-base" />}
                </div>

                {/* Header image settings */}
                {landingPageHeaderImageUrl && <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Header-höjd</Label>
                      <Select value={landingPageHeaderHeight} onValueChange={(v: "small" | "medium" | "large") => setLandingPageHeaderHeight(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Liten</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Stor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Bildpassning</Label>
                      <Select value={landingPageHeaderFit} onValueChange={(v: "cover" | "contain" | "fill") => setLandingPageHeaderFit(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Fyll (beskär)</SelectItem>
                          <SelectItem value="contain">Visa hela</SelectItem>
                          <SelectItem value="fill">Sträck ut</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>}

                <Separator />

                {/* Title and description */}
                <div className="space-y-2">
                  <Label htmlFor="landing-title">Titel</Label>
                  <Input id="landing-title" value={landingPageTitle} onChange={e => setLandingPageTitle(e.target.value)} placeholder="Mina Bilder" className="text-base" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landing-description">Beskrivning (valfritt)</Label>
                  <Textarea id="landing-description" value={landingPageDescription} onChange={e => setLandingPageDescription(e.target.value)} placeholder="En kort beskrivning..." rows={2} className="text-base" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landing-footer">Footer-text (valfritt)</Label>
                  <Input id="landing-footer" value={landingPageFooterText} onChange={e => setLandingPageFooterText(e.target.value)} placeholder="© 2024 Ditt Företag" className="text-base" />
                </div>

                <Separator />

                {/* Colors */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bg-color">Bakgrundsfärg</Label>
                    <div className="flex gap-2">
                      <input type="color" id="bg-color" value={landingPageBackgroundColor} onChange={e => setLandingPageBackgroundColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded border" />
                      <Input value={landingPageBackgroundColor} onChange={e => setLandingPageBackgroundColor(e.target.value)} className="text-base" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-color">Textfärg</Label>
                    <div className="flex gap-2">
                      <input type="color" id="text-color" value={landingPageTextColor} onChange={e => setLandingPageTextColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded border" />
                      <Input value={landingPageTextColor} onChange={e => setLandingPageTextColor(e.target.value)} className="text-base" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accent-color">Accentfärg</Label>
                    <div className="flex gap-2">
                      <input type="color" id="accent-color" value={landingPageAccentColor} onChange={e => setLandingPageAccentColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded border" />
                      <Input value={landingPageAccentColor} onChange={e => setLandingPageAccentColor(e.target.value)} className="text-base" />
                    </div>
                  </div>
                </div>

                {/* Layout */}
                <div className="space-y-2">
                  <Label>Layout</Label>
                  <Select value={landingPageLayout} onValueChange={(v: "grid" | "carousel" | "masonry") => setLandingPageLayout(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Rutnät</SelectItem>
                      <SelectItem value="carousel">Karusell</SelectItem>
                      <SelectItem value="masonry">Masonry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Preview */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Förhandsgranskning</Label>
                  <LandingPagePreview logoUrl={landingPageLogoUrl} headerImageUrl={landingPageHeaderImageUrl} backgroundColor={landingPageBackgroundColor} textColor={landingPageTextColor} accentColor={landingPageAccentColor} title={landingPageTitle} description={landingPageDescription} footerText={landingPageFooterText} layout={landingPageLayout} logoSize={landingPageLogoSize} logoPosition={landingPageLogoPosition} headerHeight={landingPageHeaderHeight} headerFit={landingPageHeaderFit} />
                </div>
              </div>
            </TabsContent>

            {userRole === "admin" && <TabsContent value="payment" className="mt-6">
                <PaymentSettings />
              </TabsContent>}

            {userRole === "admin" && <TabsContent value="team" className="mt-6">
                <TeamManagement />
              </TabsContent>}

            <TabsContent value="account" className="mt-6">
              <AccountSettings />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={saveSettings} disabled={loading}>
              {loading ? "Sparar..." : "Spara inställningar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};