import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WatermarkPreview } from "./WatermarkPreview";
import { LandingPagePreview } from "./LandingPagePreview";
import { Input } from "@/components/ui/input";

export const AiSettingsDialog = () => {
  const [open, setOpen] = useState(false);
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
  const { toast } = useToast();

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

        <Tabs defaultValue="background" className="w-full mt-2">
          <TabsList
            className="
              w-full flex flex-wrap items-center justify-between gap-2
              rounded-lg bg-muted/40 p-1
              text-xs sm:text-sm
            "
          >
            <TabsTrigger
              value="background"
              className="
                flex-1 whitespace-nowrap rounded-md px-3 py-2 text-center
                data-[state=active]:bg-background
                data-[state=active]:text-foreground
                data-[state=active]:shadow-sm
              "
            >
              Bakgrund
            </TabsTrigger>

            <TabsTrigger
              value="descriptions"
              className="
                flex-1 whitespace-nowrap rounded-md px-3 py-2 text-center
                data-[state=active]:bg-background
                data-[state=active]:text-foreground
                data-[state=active]:shadow-sm
              "
            >
              Beskrivningar
            </TabsTrigger>

            <TabsTrigger
              value="watermark"
              className="
                flex-1 whitespace-nowrap rounded-md px-3 py-2 text-center
                data-[state=active]:bg-background
                data-[state=active]:text-foreground
                data-[state=active]:shadow-sm
              "
            >
              Vattenmärke
            </TabsTrigger>

            <TabsTrigger
              value="landing"
              className="
                flex-1 whitespace-nowrap rounded-md px-3 py-2 text-center
                data-[state=active]:bg-background
                data-[state=active]:text-foreground
                data-[state=active]:shadow-sm
              "
            >
              Landningssida
            </TabsTrigger>
          </TabsList>

          <TabsContent value="background" className="space-y-4 mt-4">
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

          <TabsContent value="descriptions" className="space-y-4 mt-4">
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

          <TabsContent value="watermark" className="space-y-4 mt-4">
            {/* ... din befintliga watermark-content ... */}
            <div className="space-y-4">
              <div>
                <Label>Logotyp för vattenmärke</Label>
                {/* resten av watermark-blocket oförändrat */}
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

          <TabsContent value="landing" className="space-y-4 mt-4">
            {/* ... din befintliga landing-content, oförändrad ... */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Settings + Preview block som du redan har */}
              {/* klistra bara in din nuvarande landing-content här */}
            </div>
          </TabsContent>
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
