import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WatermarkPreview } from "./WatermarkPreview";
import { LandingPagePreview } from "./LandingPagePreview";
import { Input } from "@/components/ui/input";

export const AiSettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("background");
  const [backgroundPrompt, setBackgroundPrompt] = useState(
    "car on on clean ceramic floor with the colour #c8cfdb, with Plain white walls in the backgrond in the background, evenly lit",
  );
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
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const { toast } = useToast();

  const tabs = ["background", "descriptions", "watermark", "landing"];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      const currentIndex = tabs.indexOf(currentTab);

      if (diff > 0 && currentIndex < tabs.length - 1) {
        // Swipe left - next tab
        setCurrentTab(tabs[currentIndex + 1]);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - previous tab
        setCurrentTab(tabs[currentIndex - 1]);
      }
    }

    setTouchStart(null);
  };

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ai_settings")
        .select(
          "background_prompt, example_descriptions, logo_url, watermark_x, watermark_y, watermark_size, watermark_opacity, landing_page_logo_url, landing_page_background_color, landing_page_layout, landing_page_header_image_url, landing_page_text_color, landing_page_accent_color, landing_page_title, landing_page_description, landing_page_footer_text, landing_page_logo_size, landing_page_logo_position, landing_page_header_height, landing_page_header_fit",
        )
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setBackgroundPrompt(data.background_prompt);
        setExampleDescriptions(data.example_descriptions || "");
        setLogoUrl(data.logo_url || "");
        setWatermarkX(data.watermark_x || 20);
        setWatermarkY(data.watermark_y || 20);
        setWatermarkSize(data.watermark_size || 15);
        setWatermarkOpacity(data.watermark_opacity || 0.8);
        setLandingPageLogoUrl(data.landing_page_logo_url || "");
        setLandingPageBackgroundColor(data.landing_page_background_color || "#ffffff");
        setLandingPageLayout((data.landing_page_layout as "grid" | "carousel" | "masonry") || "grid");
        setLandingPageHeaderImageUrl(data.landing_page_header_image_url || "");
        setLandingPageTextColor(data.landing_page_text_color || "#000000");
        setLandingPageAccentColor(data.landing_page_accent_color || "#000000");
        setLandingPageTitle(data.landing_page_title || "Mina Bilder");
        setLandingPageDescription(data.landing_page_description || "");
        setLandingPageFooterText(data.landing_page_footer_text || "");
        setLandingPageLogoSize((data.landing_page_logo_size as "small" | "medium" | "large") || "medium");
        setLandingPageLogoPosition((data.landing_page_logo_position as "left" | "center" | "right") || "center");
        setLandingPageHeaderHeight((data.landing_page_header_height as "small" | "medium" | "large") || "medium");
        setLandingPageHeaderFit((data.landing_page_header_fit as "cover" | "contain" | "fill") || "cover");
      }
    } catch (error: any) {
      console.error("Error loading AI settings:", error);
      toast({
        title: "Fel vid laddning av inställningar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Inte inloggad");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("car-photos").upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("car-photos").getPublicUrl(filePath);

      setLogoUrl(publicUrl);

      toast({
        title: "Logotyp uppladdad",
        description: "Din logotyp har laddats upp",
      });
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Fel vid uppladdning",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
  };

  const handleLandingLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLandingLogo(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Inte inloggad");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-landing-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("car-photos").upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("car-photos").getPublicUrl(filePath);

      setLandingPageLogoUrl(publicUrl);

      toast({
        title: "Logotyp uppladdad",
        description: "Landningssidans logotyp har laddats upp",
      });
    } catch (error: any) {
      console.error("Error uploading landing logo:", error);
      toast({
        title: "Fel vid uppladdning",
        description: error.message,
        variant: "destructive",
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
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Inte inloggad");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-header-${Date.now()}.${fileExt}`;
      const filePath = `headers/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("car-photos").upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("car-photos").getPublicUrl(filePath);

      setLandingPageHeaderImageUrl(publicUrl);

      toast({
        title: "Header-bild uppladdad",
        description: "Landningssidans header-bild har laddats upp",
      });
    } catch (error: any) {
      console.error("Error uploading header image:", error);
      toast({
        title: "Fel vid uppladdning",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingHeaderImage(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Inte inloggad");

      const { error } = await supabase.from("ai_settings").upsert(
        {
          user_id: user.id,
          background_prompt: backgroundPrompt,
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
        },
        {
          onConflict: "user_id",
        },
      );

      if (error) throw error;

      toast({
        title: "Inställningar sparade",
        description: "AI-inställningarna har uppdaterats",
      });
      setOpen(false);
    } catch (error: any) {
      console.error("Error saving AI settings:", error);
      toast({
        title: "Fel vid sparande",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Ställ in AI för bakgrund och beskrivning</span>
          <span className="md:hidden">Inställningar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-card border-border p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            AI-inställningar
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <div className="mt-4 rounded-xl border border-border bg-muted p-3 shadow-sm md:bg-transparent md:border-0 md:p-0 md:rounded-none">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 rounded-lg bg-muted/70 p-1">
              <TabsTrigger
                value="background"
                className="text-xs md:text-sm px-2 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Bakgrund
              </TabsTrigger>
              <TabsTrigger
                value="descriptions"
                className="text-xs md:text-sm px-2 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Beskrivningar
              </TabsTrigger>
              <TabsTrigger
                value="watermark"
                className="text-xs md:text-sm px-2 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Vattenmärke
              </TabsTrigger>
              <TabsTrigger
                value="landing"
                className="text-xs md:text-sm px-2 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Landningssida
              </TabsTrigger>
            </TabsList>

            {/* Separator borttagen – ful linje försvinner */}

            <TabsContent
              value="background"
              className="space-y-4 mt-3 md:mt-4 md:p-4 md:border-2 md:border-border md:rounded-xl md:bg-card md:shadow-sm md:overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="space-y-2">
                <Label htmlFor="background-prompt">Instruktioner (prompt) för bakgrunden</Label>
                <Textarea
                  id="background-prompt"
                  value={backgroundPrompt}
                  onChange={(e) => setBackgroundPrompt(e.target.value)}
                  placeholder="Beskriv hur bakgrunden ska se ut..."
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>

            <TabsContent
              value="descriptions"
              className="space-y-4 mt-3 md:mt-4 md:p-4 md:border-2 md:border-border md:rounded-xl md:bg-card md:shadow-sm md:overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="space-y-2">
                <Label htmlFor="example-descriptions">Exempel Beskrivningar</Label>
                <Textarea
                  id="example-descriptions"
                  value={exampleDescriptions}
                  onChange={(e) => setExampleDescriptions(e.target.value)}
                  placeholder="Lägg till exempel på beskrivningar..."
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>

            <TabsContent
              value="watermark"
              className="space-y-4 mt-3 md:mt-4 md:p-4 md:border-2 md:border-border md:rounded-xl md:bg-card md:shadow-sm md:overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="space-y-4">
                <div>
                  <Label>Logotyp för vattenmärke</Label>
                  <div className="mt-2 flex flex-col gap-2">
                    {logoUrl ? (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                        <img src={logoUrl} alt="Logotyp" className="w-full h-full object-contain p-2" />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={handleRemoveLogo}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("logo-upload")?.click()}
                          disabled={uploadingLogo}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingLogo ? "Laddar upp..." : "Ladda upp logotyp"}
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Denna logotyp placeras som vattenmärke på dina bilder
                  </p>
                </div>

                <WatermarkPreview
                  logoUrl={logoUrl}
                  x={watermarkX}
                  y={watermarkY}
                  size={watermarkSize}
                  opacity={watermarkOpacity}
                  onPositionChange={(x, y) => {
                    setWatermarkX(x);
                    setWatermarkY(y);
                  }}
                  onSizeChange={setWatermarkSize}
                  onOpacityChange={setWatermarkOpacity}
                />
              </div>
            </TabsContent>

            <TabsContent
              value="landing"
              className="space-y-4 mt-3 md:mt-4 md:p-4 md:border-2 md:border-border md:rounded-xl md:bg-card md:shadow-sm md:overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Settings */}
                <div className="space-y-4">
                  <div>
                    <Label>Logotyp för landningssida</Label>
                    <div className="mt-2 flex flex-col gap-2">
                      {landingPageLogoUrl ? (
                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                          <img
                            src={landingPageLogoUrl}
                            alt="Landing logotyp"
                            className="w-full h-full object-contain p-2"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => setLandingPageLogoUrl("")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id="landing-logo-upload"
                            accept="image/*"
                            onChange={handleLandingLogoUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById("landing-logo-upload")?.click()}
                            disabled={uploadingLandingLogo}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingLandingLogo ? "Laddar upp..." : "Ladda upp logotyp"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Header-bild (valfritt)</Label>
                    <div className="mt-2 flex flex-col gap-2">
                      {landingPageHeaderImageUrl ? (
                        <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-muted">
                          <img
                            src={landingPageHeaderImageUrl}
                            alt="Header bild"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => setLandingPageHeaderImageUrl("")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id="header-upload"
                            accept="image/*"
                            onChange={handleHeaderImageUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById("header-upload")?.click()}
                            disabled={uploadingHeaderImage}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingHeaderImage ? "Laddar upp..." : "Ladda upp header-bild"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="landing-title">Titel</Label>
                    <Input
                      id="landing-title"
                      value={landingPageTitle}
                      onChange={(e) => setLandingPageTitle(e.target.value)}
                      placeholder="Mina Bilder"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="landing-description">Beskrivning (valfritt)</Label>
                    <Textarea
                      id="landing-description"
                      value={landingPageDescription}
                      onChange={(e) => setLandingPageDescription(e.target.value)}
                      placeholder="En kort beskrivning..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="landing-footer">Footer text (valfritt)</Label>
                    <Input
                      id="landing-footer"
                      value={landingPageFooterText}
                      onChange={(e) => setLandingPageFooterText(e.target.value)}
                      placeholder="© 2024 Mitt Företag"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bg-color">Bakgrundsfärg</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          id="bg-color"
                          value={landingPageBackgroundColor}
                          onChange={(e) => setLandingPageBackgroundColor(e.target.value)}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={landingPageBackgroundColor}
                          onChange={(e) => setLandingPageBackgroundColor(e.target.value)}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="text-color">Textfärg</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          id="text-color"
                          value={landingPageTextColor}
                          onChange={(e) => setLandingPageTextColor(e.target.value)}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={landingPageTextColor}
                          onChange={(e) => setLandingPageTextColor(e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accent-color">Accentfärg (knappar)</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        id="accent-color"
                        value={landingPageAccentColor}
                        onChange={(e) => setLandingPageAccentColor(e.target.value)}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={landingPageAccentColor}
                        onChange={(e) => setLandingPageAccentColor(e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Layout</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        variant={landingPageLayout === "grid" ? "default" : "outline"}
                        onClick={() => setLandingPageLayout("grid")}
                        className="w-full"
                      >
                        Grid
                      </Button>
                      <Button
                        variant={landingPageLayout === "carousel" ? "default" : "outline"}
                        onClick={() => setLandingPageLayout("carousel")}
                        className="w-full"
                      >
                        Carousel
                      </Button>
                      <Button
                        variant={landingPageLayout === "masonry" ? "default" : "outline"}
                        onClick={() => setLandingPageLayout("masonry")}
                        className="w-full"
                      >
                        Masonry
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo-size">Logotyp storlek</Label>
                    <Select
                      value={landingPageLogoSize}
                      onValueChange={(value: "small" | "medium" | "large") => setLandingPageLogoSize(value)}
                    >
                      <SelectTrigger id="logo-size">
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
                    <Label htmlFor="logo-position">Logotyp position</Label>
                    <Select
                      value={landingPageLogoPosition}
                      onValueChange={(value: "left" | "center" | "right") => setLandingPageLogoPosition(value)}
                    >
                      <SelectTrigger id="logo-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Vänster</SelectItem>
                        <SelectItem value="center">Centrerad</SelectItem>
                        <SelectItem value="right">Höger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="header-height">Headerbild höjd</Label>
                    <Select
                      value={landingPageHeaderHeight}
                      onValueChange={(value: "small" | "medium" | "large") => setLandingPageHeaderHeight(value)}
                    >
                      <SelectTrigger id="header-height">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Liten (128px)</SelectItem>
                        <SelectItem value="medium">Medium (192px)</SelectItem>
                        <SelectItem value="large">Stor (256px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="header-fit">Headerbild anpassning</Label>
                    <Select
                      value={landingPageHeaderFit}
                      onValueChange={(value: "cover" | "contain" | "fill") => setLandingPageHeaderFit(value)}
                    >
                      <SelectTrigger id="header-fit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover (täcker)</SelectItem>
                        <SelectItem value="contain">Contain (innehåller)</SelectItem>
                        <SelectItem value="fill">Fill (fyller)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Förhandsvisning</Label>
                  <LandingPagePreview
                    logoUrl={landingPageLogoUrl}
                    headerImageUrl={landingPageHeaderImageUrl}
                    backgroundColor={landingPageBackgroundColor}
                    textColor={landingPageTextColor}
                    accentColor={landingPageAccentColor}
                    title={landingPageTitle}
                    description={landingPageDescription}
                    footerText={landingPageFooterText}
                    layout={landingPageLayout}
                    logoSize={landingPageLogoSize}
                    logoPosition={landingPageLogoPosition}
                    headerHeight={landingPageHeaderHeight}
                    headerFit={landingPageHeaderFit}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            {loading ? "Sparar..." : "Spara"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
