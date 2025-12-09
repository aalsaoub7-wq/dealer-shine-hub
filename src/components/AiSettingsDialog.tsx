import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings, Upload, X, Languages, Palette, Stamp, Globe, CreditCard, Users, Check, Pencil, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { openExternalUrl } from "@/lib/nativeCapabilities";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WatermarkPreview } from "./WatermarkPreview";
import { LandingPagePreview } from "./LandingPagePreview";
import { Input } from "@/components/ui/input";
import { PaymentSettings } from "./PaymentSettings";
import { TeamManagement } from "./TeamManagement";
import { useQuery } from "@tanstack/react-query";

// Import background template images
import bgTemplate1Showroom from "@/assets/bg-template-1-showroom.jpg";
import bgTemplate2LuxuryShowroom from "@/assets/bg-template-2-luxury-showroom.jpg";
import bgTemplate3SoftGreyGradient from "@/assets/bg-template-3-soft-grey-gradient.jpg";
import bgTemplate4WhiteInfinityCove from "@/assets/bg-template-4-white-infinity-cove.jpg";
import bgTemplate5TwoToneHorizon from "@/assets/bg-template-5-two-tone-horizon.jpg";
import bgTemplate6LightShowroom from "@/assets/bg-template-6-light-showroom.jpg";
import bgTemplate7DarkWallLightFloor from "@/assets/bg-template-7-dark-wall-light-floor.jpg";
import bgTemplate8VeryLightStudio from "@/assets/bg-template-8-very-light-studio.jpg";
import bgTemplate9DarkerLowerWall from "@/assets/bg-template-9-darker-lower-wall.jpg";

// Background templates with their prompts
const BACKGROUND_TEMPLATES = [{
  id: "showroom",
  name: "Showroom",
  description: "Grå golv, vita väggar",
  image: bgTemplate1Showroom,
  prompt: "Peugeot 3008 SUV centered in frame on a perfectly flat, completely uniform matte floor in exact solid grey color #55575a, with no tiles, no seams, no lines, no texture, no patterns, no noise, no gradient and no reflections at all, the floor is a single continuous grey plane that meets a perfectly straight horizontal white skirting board, above it a completely plain matte white showroom wall with no doors, no windows, no corners, no objects and no shadows on the wall, camera straight-on at car height, neutral white studio lighting from the front, a single very soft short shadow directly under and just slightly behind the car, and absolutely no other shadows, lights, color shifts, vignetting or background details anywhere in the image."
}, {
  id: "luxury-showroom",
  name: "Lyxig Showroom",
  description: "Mörk studio, cirkulär plattform",
  image: bgTemplate2LuxuryShowroom,
  prompt: "A single car centered in frame inside a closed luxury car photo studio. The car stands on a perfectly flat, glossy dark grey floor in exact color #2b2d30, with a single uniform mirror-like reflection of the car directly under it, fading smoothly to 0 within one car length, no tiles, no seams, no lines, no texture, no patterns and no other reflections anywhere on the floor. Around the car is a perfectly circular, slightly brighter glossy platform in exact color #3a3c40, with a clean sharp edge, perfectly centered under the car. The walls are a continuous seamless matte very dark charcoal in exact color #14151a, with no corners, no doors, no windows, no objects, no logos, no panels and no visible texture, only a very subtle vertical brightness gradient from #14151a at the edges to #191b20 behind the car. Lighting is from three invisible softboxes: one large soft light directly in front of the car and two smaller symmetric lights at 45 degrees, creating extremely soft, controlled highlights on the car and a single very soft shadow just behind and slightly to the sides of the tyres. There are no other shadows, no color casts, no vignetting and no additional light sources anywhere in the scene."
}, {
  id: "soft-grey-gradient",
  name: "Mjuk Grå Gradient",
  description: "Gradient vägg",
  image: bgTemplate3SoftGreyGradient,
  prompt: "A car centered in frame on a perfectly flat matte floor in exact solid neutral grey color #80838a, with no tiles, no seams, no lines, no patterns, no texture, no noise and no reflections, the floor is a single continuous plane that meets a perfectly straight horizontal line where a smooth vertical gradient wall begins, the wall fades from slightly darker grey #30333a at the top to slightly lighter grey #3c4047 behind the car, with no corners, no doors, no windows, no panels, no logos, no text and no objects of any kind, camera straight-on at car height, neutral white studio lighting from the front and slightly above, one very soft short shadow directly under and slightly behind the car, and absolutely no other shadows, hotspots, banding, color shifts or details in the background."
}, {
  id: "white-infinity-cove",
  name: "Vit Infinity Cove",
  description: "Sömlös vit studio",
  image: bgTemplate4WhiteInfinityCove,
  prompt: "A car centered in frame on a perfectly flat matte floor in uniform solid off-white color #f2f3f5, with no tiles, no seams, no lines, no texture, no patterns and no reflections, the floor curves smoothly upward into a continuous matte white infinity wall so there is no visible corner or edge, the entire background is one seamless white cyclorama with no doors, no windows, no panels, no objects, no gradient bands and no shadows on the wall, camera straight-on at car height, neutral white studio lighting from the front and slightly above, one very soft short shadow under and just behind the tyres, and absolutely no other shadows, color variations, vignetting or background elements."
}, {
  id: "two-tone-horizon",
  name: "Tvåtonad Horisont",
  description: "Delad grå/vit",
  image: bgTemplate5TwoToneHorizon,
  prompt: "A car centered in frame on a perfectly flat matte floor in exact solid mid-grey color #b0b3ba, with no tiles, no seams, no lines, no texture, no patterns, no noise and no reflections, the floor occupies the lower 40 percent of the image and the upper 60 percent is a completely plain matte light grey wall in exact solid color #e3e5ea, separated by one perfectly straight, sharp horizontal line across the image, the wall has no doors, no windows, no panels, no corners, no logos, no text and no objects, camera straight-on at car height, neutral white studio lighting from the front, one very soft short shadow under and slightly behind the car on the floor, and absolutely no other shadows, gradients, light spots or details on either the floor or the wall."
}, {
  id: "light-showroom",
  name: "Ljus Showroom",
  description: "Ljus vägg, mörkare golv",
  image: bgTemplate6LightShowroom,
  prompt: "A car centered in frame on a perfectly flat matte floor in exact solid warm grey color #c7c2bb, with no tiles, no seams, no lines, no patterns, no texture, no noise and no reflections, the floor is a continuous plane meeting a straight horizontal white skirting board, above it a completely plain matte off-white showroom wall in solid color #f5f6f7, with no doors, no windows, no glass, no columns, no ventilation, no lamps and no objects at all, camera straight-on at car height, neutral white studio lighting slightly above eye level, a single soft short shadow under and slightly behind the car, and absolutely no other shadows, reflections, bright spots, vignetting or extra geometry in the background."
}, {
  id: "dark-wall-light-floor",
  name: "Mörk Vägg, Ljust Golv",
  description: "Kontrast stil",
  image: bgTemplate7DarkWallLightFloor,
  prompt: "A car centered in frame on a perfectly flat, uniform matte floor in solid light grey color #d0d2d7, with no tiles, seams, lines, patterns, texture, noise, gradients or reflections, the floor is a single plane that meets a perfectly straight horizontal line where a matte dark background wall in solid color #20222a starts, the wall is completely featureless with no doors, no windows, no panels, no frames, no objects and no visible corners, camera straight-on at car height, neutral white studio lighting from the front, one very soft short shadow under and slightly behind the tyres, and absolutely no other lights, backlights, rim lights, color shifts or background details in the scene."
}, {
  id: "very-light-studio",
  name: "Mycket Ljus Studio",
  description: "Nästan vit",
  image: bgTemplate8VeryLightStudio,
  prompt: "A car centered in frame on a perfectly flat matte floor in solid very light grey color #eceff2, with no tiles, no grooves, no lines, no patterns, no texture, no noise, no reflections and no gradients, the floor is a continuous flat plane meeting a matte near-white wall in solid color #f9fafb at a perfectly straight horizontal edge, the wall is completely plain with no doors, no windows, no decorations, no signs, no objects and no shadows, camera straight-on at car height, neutral white softbox lighting from the front filling the whole frame evenly, a single very soft and faint short shadow under the car, and absolutely no other shadows, bright spots, color bands or details in the background."
}, {
  id: "darker-lower-wall",
  name: "Mörkare Nedre Väggband",
  description: "Subtil väggdelning",
  image: bgTemplate9DarkerLowerWall,
  prompt: "A car centered in frame on a perfectly flat matte floor in uniform solid neutral grey color #a8abb3, with no tiles, seams, lines, texture, patterns, noise, gradients or reflections, the floor meets a matte white wall where the lower 15 percent of the wall is a slightly darker white band in solid color #e1e3e6 like a clean protective strip, and the upper part of the wall is pure matte white, the wall has no doors, no windows, no panels, no objects, no outlets and no shadows, camera straight-on at car height, neutral white studio lighting from the front, one very soft short shadow under and just behind the tyres, and absolutely no other shadows, color variations, markings or background elements."
}];
export const AiSettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("background");
  const [backgroundPrompt, setBackgroundPrompt] = useState("car on on clean ceramic floor with the colour #c8cfdb, with Plain white walls in the backgrond in the background, evenly lit");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [customBackgroundSeed, setCustomBackgroundSeed] = useState<string | null>(null);

  // Generate a random 9-digit seed
  const generateCustomSeed = () => {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  };
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
  const [translating, setTranslating] = useState(false);
  const [removingLogoBg, setRemovingLogoBg] = useState(false);
  
  const {
    toast
  } = useToast();
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

      // Get user's company_id
      const {
        data: companyData
      } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id).single();
      if (!companyData) return;
      const {
        data,
        error
      } = await supabase.from("ai_settings").select("background_prompt, background_template_id, custom_background_seed, example_descriptions, logo_url, watermark_x, watermark_y, watermark_size, watermark_opacity, landing_page_logo_url, landing_page_background_color, landing_page_layout, landing_page_header_image_url, landing_page_text_color, landing_page_accent_color, landing_page_title, landing_page_description, landing_page_footer_text, landing_page_logo_size, landing_page_logo_position, landing_page_header_height, landing_page_header_fit").eq("company_id", companyData.company_id).single();
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      if (data) {
        const savedPrompt = data.background_prompt;
        const savedTemplateId = (data as any).background_template_id;
        setBackgroundPrompt(savedPrompt);

        // Load custom background seed if available
        const savedCustomSeed = (data as any).custom_background_seed;
        setCustomBackgroundSeed(savedCustomSeed || null);

        // Use saved template_id if available, otherwise match by prompt
        if (savedTemplateId) {
          const matchingTemplate = BACKGROUND_TEMPLATES.find(t => t.id === savedTemplateId);
          if (matchingTemplate) {
            setSelectedTemplateId(savedTemplateId);
            setUseCustomPrompt(false);
            setCustomPrompt("");
          } else {
            setSelectedTemplateId(null);
            setUseCustomPrompt(true);
            setCustomPrompt(savedPrompt);
          }
        } else {
          // Fallback to prompt matching for backwards compatibility
          const matchingTemplate = BACKGROUND_TEMPLATES.find(t => t.prompt === savedPrompt);
          if (matchingTemplate) {
            setSelectedTemplateId(matchingTemplate.id);
            setUseCustomPrompt(false);
            setCustomPrompt("");
          } else {
            setSelectedTemplateId(null);
            setUseCustomPrompt(true);
            setCustomPrompt(savedPrompt);
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
      toast({
        title: "Logotyp uppladdad",
        description: "Din logotyp har laddats upp"
      });
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
        body: { imageUrl: logoUrl }
      });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      
      setLogoUrl(response.data.newUrl);
      toast({ 
        title: "Bakgrund borttagen", 
        description: "Logotypens bakgrund har tagits bort" 
      });
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
        body: { imageUrl: landingPageLogoUrl }
      });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      
      setLandingPageLogoUrl(response.data.newUrl);
      toast({ 
        title: "Bakgrund borttagen", 
        description: "Logotypens bakgrund har tagits bort" 
      });
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
      toast({
        title: "Logotyp uppladdad",
        description: "Landningssidans logotyp har laddats upp"
      });
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
      toast({
        title: "Header-bild uppladdad",
        description: "Landningssidans header-bild har laddats upp"
      });
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
  const handleTranslateToEnglish = async () => {
    const textToTranslate = useCustomPrompt ? customPrompt : backgroundPrompt;
    if (!textToTranslate.trim()) {
      toast({
        title: "Ingen text att översätta",
        description: "Ange en text i bakgrundsfältet först",
        variant: "destructive"
      });
      return;
    }
    setTranslating(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("translate-text", {
        body: {
          text: textToTranslate
        }
      });
      if (error) throw error;
      if (data?.translatedText) {
        setBackgroundPrompt(data.translatedText);
        if (useCustomPrompt) {
          setCustomPrompt(data.translatedText);
        }
        toast({
          title: "Översättning klar",
          description: "Texten har översatts till engelska"
        });
      } else {
        throw new Error("Ingen översättning mottagen");
      }
    } catch (error: any) {
      console.error("Error translating text:", error);
      toast({
        title: "Fel vid översättning",
        description: error.message || "Kunde inte översätta texten",
        variant: "destructive"
      });
    } finally {
      setTranslating(false);
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

      // Get user's company_id
      const {
        data: companyData
      } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id).single();
      if (!companyData) throw new Error("Kunde inte hitta företag");

      // Determine template ID to save (null for custom prompt)
      const templateIdToSave = useCustomPrompt ? null : selectedTemplateId;
      // Save custom seed only if using custom prompt
      const seedToSave = useCustomPrompt ? customBackgroundSeed : null;
      const {
        error
      } = await supabase.from("ai_settings").upsert({
        user_id: user.id,
        company_id: companyData.company_id,
        background_prompt: backgroundPrompt,
        background_template_id: templateIdToSave,
        custom_background_seed: seedToSave,
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
      toast({
        title: "Inställningar sparade",
        description: "Dina AI-inställningar har sparats"
      });
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
  const handleSelectTemplate = (templateId: string) => {
    const template = BACKGROUND_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setBackgroundPrompt(template.prompt);
      setUseCustomPrompt(false);
      setCustomPrompt("");
      setCustomBackgroundSeed(null);
    }
  };
  const handleSelectCustomPrompt = () => {
    setSelectedTemplateId(null);
    setUseCustomPrompt(true);
    // Keep existing custom prompt or start fresh
    if (!customPrompt) {
      setBackgroundPrompt("");
    } else {
      setBackgroundPrompt(customPrompt);
    }
    // Generate a new seed for custom prompt if none exists
    if (!customBackgroundSeed) {
      setCustomBackgroundSeed(generateCustomSeed());
    }
  };
  const handleCustomPromptChange = (value: string) => {
    setCustomPrompt(value);
    setBackgroundPrompt(value);
    // Generate new seed when prompt changes
    setCustomBackgroundSeed(generateCustomSeed());
  };

  // Expose function for external access
  useEffect(() => {
    (window as any).openSettingsDialog = () => setOpen(true);
    return () => {
      delete (window as any).openSettingsDialog;
    };
  }, []);
  const navigate = useNavigate();

  const handleGuideClick = async () => {
    if (Capacitor.isNativePlatform()) {
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
          <TabsList className={`grid w-full overflow-hidden ${userRole === "admin" ? "grid-cols-5" : "grid-cols-3"}`}>
            <TabsTrigger value="background" className="flex items-center gap-1">
              <Palette className="h-4 w-4 md:hidden" />
              <span className="hidden md:inline">Bakgrund</span>
            </TabsTrigger>
            <TabsTrigger value="watermark" className="flex items-center gap-1 min-w-0">
              <Stamp className="h-4 w-4 md:hidden flex-shrink-0" />
              <span className="hidden md:inline truncate">Logo</span>
            </TabsTrigger>
            <TabsTrigger value="landing" className="flex items-center gap-1">
              <Globe className="h-4 w-4 md:hidden" />
              <span className="hidden md:inline">Landningssida</span>
            </TabsTrigger>
            {userRole === "admin" && <>
                <TabsTrigger value="payment" className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4 md:hidden" />
                  <span className="hidden md:inline">Betalning</span>
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-1">
                  <Users className="h-4 w-4 md:hidden" />
                  <span className="hidden md:inline">Anställda</span>
                </TabsTrigger>
              </>}
          </TabsList>

          <TabsContent value="background" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Välj bakgrundsmall</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Välj en av våra fördefinierade bakgrunder eller skapa en egen
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BACKGROUND_TEMPLATES.map(template => <div key={template.id} className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-primary ${selectedTemplateId === template.id && !useCustomPrompt ? "border-primary bg-primary/5" : "border-border"}`} onClick={() => handleSelectTemplate(template.id)}>
                    <div className="aspect-video mb-2 overflow-hidden rounded-md bg-muted">
                      <img src={template.image} alt={template.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      {selectedTemplateId === template.id && !useCustomPrompt && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                    </div>
                  </div>)}

                {/* Custom prompt option */}
                <div className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-primary ${useCustomPrompt ? "border-primary bg-primary/5" : "border-border"}`} onClick={handleSelectCustomPrompt}>
                  <div className="aspect-video mb-2 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                    <Pencil className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Egen Bakgrund</h4>
                      <p className="text-xs text-muted-foreground">Skriv din egen prompt</p>
                    </div>
                    {useCustomPrompt && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                  </div>
                </div>
              </div>

              {useCustomPrompt && <div className="space-y-3 mt-4 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="custom-prompt" className="font-medium">Din egen prompt</Label>
                    <Button variant="outline" size="sm" onClick={handleTranslateToEnglish} disabled={translating} className="gap-2">
                      <Languages className="h-4 w-4" />
                      {translating ? "Översätter..." : "Översätt till engelska"}
                    </Button>
                  </div>
                  <Textarea id="custom-prompt" value={customPrompt} onChange={e => handleCustomPromptChange(e.target.value)} placeholder="Beskriv hur du vill att bakgrunden ska se ut..." rows={4} className="text-base" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    ⚠️ OBS! Egna bakgrunder kan bli dåliga då du styr de helt själv
                  </p>
                </div>}
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRemoveLogoBackground}
                      disabled={removingLogoBg}
                      className="text-xs px-2 h-8"
                    >
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
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={Math.round(watermarkOpacity * 100)} 
                      onChange={e => setWatermarkOpacity(Number(e.target.value) / 100)} 
                      className="w-full" 
                    />
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRemoveLandingLogoBackground}
                      disabled={removingLandingLogoBg}
                      className="text-xs px-2 h-8"
                    >
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