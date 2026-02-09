import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  FileText,
  Trash2,
  Save,
  Settings,
  Share2,
  Stamp,
  Sparkles,
  ChevronDown,
  Download,
  Palette,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGalleryDraggable from "@/components/PhotoGalleryDraggable";
import { PlatformSyncDialog } from "@/components/PlatformSyncDialog";
import EditCarDialog from "@/components/EditCarDialog";
import { applyWatermark } from "@/lib/watermark";
import { compositeCarOnBackground } from "@/lib/carCompositing";
import { compositeCarOnSolidColor } from "@/lib/interiorCompositing";
import { trackUsage, trackRegenerationUsage } from "@/lib/usageTracking";
import { CarDetailSkeleton } from "@/components/CarDetailSkeleton";
import { useHaptics } from "@/hooks/useHaptics";
import { nativeShare } from "@/lib/nativeCapabilities";
import { analytics } from "@/lib/analytics";
import { CarPositionEditor } from "@/components/CarPositionEditor";
import { WatermarkPositionEditor } from "@/components/WatermarkPositionEditor";
import { InteriorColorDialog } from "@/components/InteriorColorDialog";
import { InteriorBackgroundDialog } from "@/components/InteriorBackgroundDialog";
import { BackgroundTemplate } from "@/components/AiSettingsDialog";
import { LicensePlateChoiceDialog } from "@/components/LicensePlateChoiceDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  notes: string | null;
  price: number | null;
  registration_number: string | null;
  fuel: string | null;
  gearbox: string | null;
  description: string | null;
  publish_on_blocket: boolean;
  deleted_at?: string | null;
}

interface Photo {
  id: string;
  url: string;
  photo_type: "main" | "documentation";
  is_edited: boolean;
  is_processing?: boolean;
  original_url: string | null;
  transparent_url: string | null;
  display_order: number;
  has_watermark?: boolean;
  watermark_x?: number;
  watermark_y?: number;
  watermark_size?: number;
  watermark_opacity?: number;
  pre_watermark_url?: string | null;
  edit_type?: string | null;
  interior_background_url?: string | null;
  has_free_regeneration?: boolean;
}

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState<CarData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"main" | "documentation">("main");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedNotes, setEditedNotes] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [selectedMainPhotos, setSelectedMainPhotos] = useState<string[]>([]);
  const [selectedDocPhotos, setSelectedDocPhotos] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const [applyingWatermark, setApplyingWatermark] = useState(false);
  const [activeTab, setActiveTab] = useState("main");
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  // Position editor state
  const [positionEditorPhoto, setPositionEditorPhoto] = useState<{
    id: string;
    transparentCarUrl: string;
    editType?: string | null;
    backgroundColor?: string;
    backgroundImageUrl?: string; // For interior with image background
    moveBackground?: boolean; // If true, user moves background instead of car
  } | null>(null);
  const [positionEditorSaving, setPositionEditorSaving] = useState(false);
  // Interior color change state (for regeneration)
  const [interiorColorChangePhotoId, setInteriorColorChangePhotoId] = useState<string | null>(null);
  // Watermark position editor state
  const [watermarkEditorPhoto, setWatermarkEditorPhoto] = useState<{
    id: string;
    preWatermarkUrl: string;
    logoUrl: string;
    xPercent: number;
    yPercent: number;
    size: number;
    opacity: number;
  } | null>(null);
  const [watermarkEditorSaving, setWatermarkEditorSaving] = useState(false);
  // Background template state
  const [backgroundUrl, setBackgroundUrl] = useState<string>("/backgrounds/studio-background.jpg");
  const [backgroundTemplateId, setBackgroundTemplateId] = useState<string>("studio-background");
  // Interior dialogs state
  const [interiorBackgroundDialogOpen, setInteriorBackgroundDialogOpen] = useState(false);
  const [interiorDialogOpen, setInteriorDialogOpen] = useState(false);
  const [interiorColorHistory, setInteriorColorHistory] = useState<string[]>([]);
  const [processingInterior, setProcessingInterior] = useState(false);
  // Available interior backgrounds from current template
  const [availableInteriorBackgrounds, setAvailableInteriorBackgrounds] = useState<string[]>([]);
  // License plate choice dialog state
  const [plateChoiceOpen, setPlateChoiceOpen] = useState(false);
  const [pendingEditPhotos, setPendingEditPhotos] = useState<{ids: string[], type: "main" | "documentation"} | null>(null);
  const [pendingPlateAction, setPendingPlateAction] = useState<
    { type: "regenerate"; photoId: string } |
    { type: "positionSave"; compositionBlob: Blob; photoId: string } |
    null
  >(null);
  const { toast } = useToast();
  const { lightImpact, successNotification } = useHaptics();
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: timeout wrapper for API calls
  const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), ms)
    );
    return Promise.race([promise, timeout]);
  };

  // Reset photos stuck in processing for more than 2 minutes
  // Returns array of reset photo IDs (if any)
  const resetStuckPhotos = async (): Promise<string[]> => {
    if (!id) return [];
    
    const ninetySecondsAgo = new Date(Date.now() - 90 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from("photos")
      .update({ is_processing: false })
      .eq("car_id", id)
      .eq("is_processing", true)
      .lt("updated_at", seventySecondsAgo)
      .select("id");
      
    if (error) {
      console.error("Error resetting stuck photos:", error);
      return [];
    }
    
    const resetIds = data?.map(p => p.id) || [];
    
    // Show toast if any photos were auto-reset
    if (resetIds.length > 0) {
      console.log("Auto-reset stuck photos:", resetIds);
      toast({
        title: "Oj!",
        description: "Vår AI fick för många bollar att jonglera",
        variant: "info",
      });
    }
    
    return resetIds;
  };

  useEffect(() => {
    if (id) {
      fetchCarData();
      resetStuckPhotos(); // Auto-reset stuck photos on page load
      checkPaymentMethod();
      fetchBackgroundSettings();
      fetchInteriorColorHistory();

      // Set up realtime subscription for photo updates
      const channel = supabase
        .channel('photos-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'photos',
            filter: `car_id=eq.${id}`
          },
          (payload) => {
            // Debounce to handle multi-upload without multiple reloads
            if (fetchDebounceRef.current) {
              clearTimeout(fetchDebounceRef.current);
            }
            fetchDebounceRef.current = setTimeout(() => {
              fetchCarData(true);
            }, 500);
          }
        )
        .subscribe();

      // Watchdog interval: check every 10 seconds for stuck photos
      // This ensures photos can't stay stuck for more than ~90 seconds
      const watchdogInterval = setInterval(() => {
        resetStuckPhotos();
      }, 10000); // 10 seconds

      return () => {
        supabase.removeChannel(channel);
        if (fetchDebounceRef.current) {
          clearTimeout(fetchDebounceRef.current);
        }
        clearInterval(watchdogInterval);
      };
    }
  }, [id]);

  const fetchBackgroundSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyData } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) return;

      const { data: settings } = await supabase
        .from("ai_settings")
        .select("background_template_id")
        .eq("company_id", companyData.company_id)
        .single();

      if (settings?.background_template_id) {
        // Fetch the background template from database
        const { data: template } = await supabase
          .from("background_templates")
          .select("image_url, interior_backgrounds")
          .eq("template_id", settings.background_template_id)
          .single();
        
        if (template?.image_url) {
          setBackgroundUrl(template.image_url);
        }
        setBackgroundTemplateId(settings.background_template_id);
        
        // Set interior backgrounds from database
        // If interior_backgrounds is empty, fallback to using the template's own image_url
        if (template?.interior_backgrounds && Array.isArray(template.interior_backgrounds) && template.interior_backgrounds.length > 0) {
          setAvailableInteriorBackgrounds(template.interior_backgrounds);
        } else if (template?.image_url) {
          // Fallback: use the template's own background image for interior editing
          setAvailableInteriorBackgrounds([template.image_url]);
        }
      }
    } catch (error) {
      console.error("Error fetching background settings:", error);
    }
  };

  const fetchInteriorColorHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyData } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) return;

      const { data: settings } = await supabase
        .from("ai_settings")
        .select("interior_color_history")
        .eq("company_id", companyData.company_id)
        .single();

      if (settings?.interior_color_history) {
        setInteriorColorHistory(settings.interior_color_history);
      }
    } catch (error) {
      console.error("Error fetching interior color history:", error);
    }
  };

  const checkPaymentMethod = async () => {
    try {
      setCheckingPayment(true);
      const { data, error } = await supabase.functions.invoke("get-billing-info");
      
      if (error) throw error;
      
      // User can edit if they have payment method OR active subscription
      const hasAccess = data?.hasPaymentMethod || data?.hasActiveSubscription || false;
      setHasPaymentMethod(hasAccess);
    } catch (error) {
      console.error("Error checking payment method:", error);
      setHasPaymentMethod(false);
    } finally {
      setCheckingPayment(false);
    }
  };

  const fetchCarData = async (preserveScroll = false) => {
    // Save current scroll position if requested
    const scrollY = preserveScroll ? window.scrollY : 0;

    // Only show skeleton on initial load, not on realtime updates
    if (!preserveScroll) {
      setLoading(true);
    }
    try {
      // Fetch car details
      const { data: carData, error: carError } = await supabase.from("cars").select("*").eq("id", id).single();

      if (carError) throw carError;
      setCar(carData);
      setEditedNotes(carData.notes || "");

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from("photos")
        .select("*")
        .eq("car_id", id)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (photosError) throw photosError;
      setPhotos((photosData || []) as Photo[]);

      // Restore scroll position after a short delay to allow rendering
      if (preserveScroll) {
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 0);
      }
    } catch (error: any) {
      toast({
        title: "Fel vid laddning av bildata",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCar = async () => {
    try {
      const { error } = await supabase.from("cars").delete().eq("id", id);
      if (error) throw error;
      toast({
        title: "Bil raderad",
        description: "Bilen och alla foton har permanent raderats.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Fel vid radering av bil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleArchiveCar = async () => {
    try {
      const newDeletedAt = car?.deleted_at ? null : new Date().toISOString();
      const { error } = await supabase
        .from("cars")
        .update({ deleted_at: newDeletedAt })
        .eq("id", id);
      if (error) throw error;
      
      toast({
        title: car?.deleted_at ? "Bil avarkiverad" : "Bil arkiverad",
        description: car?.deleted_at 
          ? "Bilen syns nu på startsidan igen" 
          : "Bilen är nu arkiverad. Sök på \"arkiv\" för att hitta den.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadPhotos = async (photoIds: string[]) => {
    const photosToDownload = [...mainPhotos, ...docPhotos].filter(p => photoIds.includes(p.id));
    
    for (const photo of photosToDownload) {
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `photo-${photo.id}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Download error:', error);
      }
    }
    
    analytics.imageDownloaded(car!.id, photosToDownload.length, 'car_detail');
  };

  const handleSharePhotos = async (photoIds: string[]) => {
    if (photoIds.length === 0) return;

    setSharing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Ingen användare inloggad");

      // Get user's company_id
      const { data: companyData } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) throw new Error("Kunde inte hitta företag");

      // Get company's landing page settings
      const { data: settings } = await supabase
        .from("ai_settings")
        .select("landing_page_logo_url, landing_page_background_color, landing_page_layout, landing_page_header_image_url, landing_page_text_color, landing_page_accent_color, landing_page_title, landing_page_description, landing_page_footer_text, landing_page_logo_size, landing_page_logo_position, landing_page_header_height, landing_page_header_fit")
        .eq("company_id", companyData.company_id)
        .maybeSingle();

      // Generate unique share token
      const { data: tokenData, error: tokenError } = await supabase.rpc("generate_share_token");
      if (tokenError) throw tokenError;

      // Create shared collection with 30-day expiration and landing page settings
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const { error } = await supabase.from("shared_collections").insert({
        user_id: user.id,
        title: `${car.make} ${car.model} ${car.year}`,
        photo_ids: photoIds,
        share_token: tokenData,
        expires_at: expiresAt.toISOString(),
        landing_page_logo_url: settings?.landing_page_logo_url,
        landing_page_background_color: settings?.landing_page_background_color || "#ffffff",
        landing_page_layout: settings?.landing_page_layout || "grid",
        landing_page_header_image_url: settings?.landing_page_header_image_url,
        landing_page_text_color: settings?.landing_page_text_color || "#000000",
        landing_page_accent_color: settings?.landing_page_accent_color || "#000000",
        landing_page_title: settings?.landing_page_title || "Mina Bilder",
        landing_page_description: settings?.landing_page_description,
        landing_page_footer_text: settings?.landing_page_footer_text,
        landing_page_logo_size: settings?.landing_page_logo_size || "medium",
        landing_page_logo_position: settings?.landing_page_logo_position || "center",
        landing_page_header_height: settings?.landing_page_header_height || "medium",
        landing_page_header_fit: settings?.landing_page_header_fit || "cover",
      });

      if (error) throw error;

      // Generate shareable URL
      const shareUrl = `${window.location.origin}/shared/${tokenData}`;

      // Try native share first
      const shared = await nativeShare(
        `${car.make} ${car.model} ${car.year}`,
        "",
        shareUrl
      );

      // Fallback to clipboard if native share not available
      if (!shared) {
        navigator.clipboard.writeText(shareUrl);
      }
      
      successNotification();

      // Clear selections
      setSelectedMainPhotos([]);
      setSelectedDocPhotos([]);
    } catch (error: any) {
      console.error("Error sharing photos:", error);
      toast({
        title: "Fel vid delning",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!car) return;
    setIsSavingNotes(true);
    try {
      const { error } = await supabase.from("cars").update({ notes: editedNotes }).eq("id", id);
      if (error) throw error;
      setCar({ ...car, notes: editedNotes });
    } catch (error: any) {
      toast({
        title: "Fel vid sparande av anteckningar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleEditPhotos = async (photoIds: string[], photoType: "main" | "documentation", removePlate: boolean = false) => {
    // Check payment method requirement
    if (!hasPaymentMethod) {
      const { dismiss } = toast({
        title: "Betalmetod krävs",
        description: "Kontakta din admin för att få tillgång till redigering.",
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dismiss();
              navigate("/dashboard");
              setTimeout(() => {
                if ((window as any).openSettingsDialog) {
                  (window as any).openSettingsDialog("payment");
                }
              }, 300);
            }}
          >
            Gå till inställningar
          </Button>
        ),
      });
      return;
    }


    const photos = photoType === "main" ? mainPhotos : docPhotos;

    // Clear selection immediately
    if (photoType === "main") {
      setSelectedMainPhotos([]);
    } else {
      setSelectedDocPhotos([]);
    }

    // Mark photos as processing in database
    const photosToProcess = photos.filter((p) => photoIds.includes(p.id));
    
    for (const photo of photosToProcess) {
      await supabase
        .from("photos")
        .update({ is_processing: true })
        .eq("id", photo.id);
    }

    // Process photos independently in background
    photosToProcess.forEach((photo) => {
      // Process each photo independently without blocking
      (async () => {
        try {
          // STEP 1: Segment - Remove background using PhotoRoom (now returns URL directly!)
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const file = new File([blob], "photo.jpg", { type: blob.type });

          const segmentFormData = new FormData();
          segmentFormData.append("image_file", file);
          segmentFormData.append("car_id", car!.id);
          segmentFormData.append("photo_id", photo.id);

          console.log("Step 1: Calling segment-car API...");
          const { data: segmentData, error: segmentError } = await withTimeout(
            supabase.functions.invoke("segment-car", { body: segmentFormData }),
            60000, // 60 second timeout
            "Segmentering tog för lång tid, försök igen"
          );

          if (segmentError) throw segmentError;
          if (!segmentData?.url) throw new Error("No URL returned from segment-car");

          // transparent_url is now directly from storage (no base64 conversion!)
          const transparentPublicUrl = segmentData.url;
          console.log("Step 1 complete: Transparent PNG at", transparentPublicUrl);

          // STEP 2: Canvas compositing - Place car on background (4K, 98% quality)
          console.log("Step 2: Compositing car on background (4K 3840x2880, 98% quality)...");
          const compositedBlob = await compositeCarOnBackground(
            transparentPublicUrl,
            backgroundUrl
          );
          console.log("Step 2 complete: Composited blob size:", compositedBlob.size, "bytes");

          // STEP 3: Add reflection using Gemini (now returns URL directly!)
          console.log("Step 3: Adding reflection with Gemini...");
          const reflectionFormData = new FormData();
          reflectionFormData.append("image_file", new File([compositedBlob], "composited.jpg", { type: "image/jpeg" }));
          reflectionFormData.append("car_id", car!.id);
          reflectionFormData.append("photo_id", photo.id);
          reflectionFormData.append("remove_plate", removePlate ? "true" : "false");

          const { data: reflectionData, error: reflectionError } = await withTimeout(
            supabase.functions.invoke("add-reflection", { body: reflectionFormData }),
            90000, // 90 second timeout for reflection
            "Reflektioner tog för lång tid, försök igen"
          );

          if (reflectionError) throw reflectionError;
          if (!reflectionData?.url) throw new Error("No URL returned from add-reflection");

          // Final image URL is directly from storage (no base64 conversion, no re-upload!)
          const publicUrl = reflectionData.url;
          console.log("Step 3 complete: Final edited image at", publicUrl);

          // Update photo with transparent_url cached - realtime will handle UI update
          await supabase
            .from("photos")
            .update({
            url: publicUrl,
            original_url: photo.url,
            transparent_url: transparentPublicUrl,
            is_edited: true,
            is_processing: false,
            edit_type: 'studio',
            has_free_regeneration: true, // Grant one free regeneration
          })
            .eq("id", photo.id);

          // Track usage for this edited image
          try {
            await trackUsage("edited_image", car!.id);
            
            // Track analytics - check if first edited image
            const { count } = await supabase
              .from("photos")
              .select("*", { count: "exact", head: true })
              .eq("is_edited", true);
            
            if (count === 1) {
              analytics.firstImageEdited();
            }
            analytics.imageEdited(car!.id);
          } catch (error) {
            console.error("Error tracking usage:", error);
          }
        } catch (error) {
          console.error(`Error editing photo ${photo.id}:`, error);
          // Clear processing state on error
          await supabase
            .from("photos")
            .update({ is_processing: false })
            .eq("id", photo.id);
          
          toast({
            title: "Oj!",
            description: "Vår AI fick för många bollar att jonglera",
            variant: "info",
          });
        }
      })();
    });
  };

  const handleInteriorEdit = async (color: string) => {
    setInteriorDialogOpen(false);
    
    if (!hasPaymentMethod) {
      toast({
        title: "Betalmetod krävs",
        description: "Du måste lägga till en betalmetod för att redigera bilder.",
        variant: "destructive",
      });
      return;
    }

    const photoIds = selectedMainPhotos;
    const photos = mainPhotos.filter((p) => photoIds.includes(p.id));
    
    // Clear selection immediately
    setSelectedMainPhotos([]);
    setProcessingInterior(true);

    // Save color to history
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: companyData } = await supabase
          .from("user_companies")
          .select("company_id")
          .eq("user_id", user.id)
          .single();

        if (companyData) {
          // Add color to history (avoid duplicates, keep max 12)
          const newHistory = [color, ...interiorColorHistory.filter(c => c !== color)].slice(0, 12);
          setInteriorColorHistory(newHistory);
          
          await supabase
            .from("ai_settings")
            .update({ interior_color_history: newHistory })
            .eq("company_id", companyData.company_id);
        }
      }
    } catch (error) {
      console.error("Error saving color history:", error);
    }

    // Mark photos as processing
    for (const photo of photos) {
      await supabase
        .from("photos")
        .update({ is_processing: true })
        .eq("id", photo.id);
    }

    // Process photos independently in background
    photos.forEach((photo) => {
      (async () => {
        try {
          // STEP 1: Segment - Remove background using Remove.bg
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const file = new File([blob], "photo.jpg", { type: blob.type });

          const segmentFormData = new FormData();
          segmentFormData.append("image_file", file);
          segmentFormData.append("car_id", car!.id);
          segmentFormData.append("photo_id", photo.id);

          console.log("Interior Step 1: Calling segment-car API...");
          const { data: segmentData, error: segmentError } = await withTimeout(
            supabase.functions.invoke("segment-car", { body: segmentFormData }),
            60000,
            "Segmentering tog för lång tid, försök igen"
          );

          if (segmentError) throw segmentError;
          if (!segmentData?.url) throw new Error("No URL returned from segment-car");

          const transparentPublicUrl = segmentData.url;
          console.log("Interior Step 1 complete: Transparent PNG at", transparentPublicUrl);

          // STEP 2: Canvas compositing - Place car on solid color background
          console.log("Interior Step 2: Compositing car on solid color background...");
          const compositedBlob = await compositeCarOnSolidColor(
            transparentPublicUrl,
            color
          );
          console.log("Interior Step 2 complete: Composited blob size:", compositedBlob.size, "bytes");

          // STEP 3: Upload result to storage
          const fileName = `interior-${photo.id}-${Date.now()}.jpg`;
          const filePath = `edited/${car!.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from("car-photos")
            .upload(filePath, compositedBlob, {
              contentType: "image/jpeg",
              upsert: true,
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("car-photos")
            .getPublicUrl(filePath);

          const publicUrl = urlData.publicUrl;
          console.log("Interior Step 3 complete: Final image at", publicUrl);

          // Update photo record - skip Gemini reflection step
          await supabase
            .from("photos")
            .update({
              url: publicUrl,
              original_url: photo.url,
              transparent_url: transparentPublicUrl,
              is_edited: true,
              is_processing: false,
              edit_type: 'interior',
              interior_background_url: null, // Solid color was used
              has_free_regeneration: true, // Grant one free regeneration
            })
            .eq("id", photo.id);

          // Track usage
          try {
            await trackUsage("edited_image", car!.id);
            analytics.imageEdited(car!.id);
          } catch (error) {
            console.error("Error tracking usage:", error);
          }
        } catch (error) {
          console.error(`Error editing interior photo ${photo.id}:`, error);
          await supabase
            .from("photos")
            .update({ is_processing: false })
            .eq("id", photo.id);
          
          toast({
            title: "Oj!",
            description: "Vår AI fick för många bollar att jonglera",
            variant: "info",
          });
        }
      })();
    });

    setProcessingInterior(false);
  };

  const handleRegeneratePhoto = async (photoId: string) => {
    const photo = mainPhotos.find(p => p.id === photoId);
    if (!photo || !photo.original_url) {
      toast({
        title: "Kan inte regenerera",
        description: "Originalbild saknas",
        variant: "destructive",
      });
      return;
    }

    // Check payment/trial requirements
    if (!hasPaymentMethod) {
      toast({
        title: "Betalmetod krävs",
        description: "Du måste lägga till en betalmetod för att regenerera bilder.",
        variant: "destructive",
      });
      return;
    }

    console.log("Regenerating photo:", photoId);

    // Mark photo as processing
    await supabase
      .from("photos")
      .update({ is_processing: true })
      .eq("id", photoId);

    // Process in background
    (async () => {
      try {
        let transparentCarUrl: string;

        // Check if we have cached transparent image
        if (photo.transparent_url) {
          console.log("Regenerate: Using cached transparent image");
          transparentCarUrl = photo.transparent_url;
        } else {
          // STEP 1: Segment - Remove background using PhotoRoom (now returns URL directly!)
          console.log("Regenerate Step 1: Calling segment-car API...");
          const response = await fetch(photo.original_url!);
          const blob = await response.blob();
          const file = new File([blob], "photo.jpg", { type: blob.type });

          const segmentFormData = new FormData();
          segmentFormData.append("image_file", file);
          segmentFormData.append("car_id", car!.id);
          segmentFormData.append("photo_id", photo.id);

          const { data: segmentData, error: segmentError } = await withTimeout(
            supabase.functions.invoke("segment-car", { body: segmentFormData }),
            60000,
            "Segmentering tog för lång tid, försök igen"
          );

          if (segmentError) throw segmentError;
          if (!segmentData?.url) throw new Error("No URL returned from segment-car");

          // transparent_url is now directly from storage
          const transparentPublicUrl = segmentData.url;

          // Save transparent_url to database
          await supabase
            .from("photos")
            .update({ transparent_url: transparentPublicUrl })
            .eq("id", photoId);

          transparentCarUrl = transparentPublicUrl;
        }

        // STEP 2: Canvas compositing - Place car on background (4K, 98% quality)
        console.log("Regenerate Step 2: Compositing car on background (4K 3840x2880, 98% quality)...");
        const compositedBlob = await compositeCarOnBackground(
          transparentCarUrl,
          backgroundUrl
        );

        // STEP 3: Add reflection using Gemini (now returns URL directly!)
        console.log("Regenerate Step 3: Adding reflection with Gemini...");
        const reflectionFormData = new FormData();
        reflectionFormData.append("image_file", new File([compositedBlob], "composited.jpg", { type: "image/jpeg" }));
        reflectionFormData.append("car_id", car!.id);
        reflectionFormData.append("photo_id", photo.id);

        const { data: reflectionData, error: reflectionError } = await withTimeout(
          supabase.functions.invoke("add-reflection", { body: reflectionFormData }),
          70000,
          "Reflektioner tog för lång tid, försök igen"
        );

        if (reflectionError) throw reflectionError;
        if (!reflectionData?.url) throw new Error("No URL returned from add-reflection");

        // Final image URL is directly from storage
        const publicUrl = reflectionData.url;

        // Update photo - keep original_url, update url
        await supabase
          .from("photos")
          .update({
            url: publicUrl,
            is_processing: false,
          })
          .eq("id", photoId);

        // Track usage for this regenerated image (uses free regeneration if available)
        try {
          await trackRegenerationUsage(photoId, car!.id);
          analytics.imageRegenerated(car!.id);
        } catch (error) {
          console.error("Error tracking usage for regeneration:", error);
        }

        successNotification();
      } catch (error) {
        console.error(`Error regenerating photo ${photoId}:`, error);
        await supabase
          .from("photos")
          .update({ is_processing: false })
          .eq("id", photoId);

        toast({
          title: "Oj!",
          description: "Vår AI fick för många bollar att jonglera",
          variant: "info",
        });
      }
    })();
  };

  // Handler for "Generera ny skugga och reflektion" - opens plate choice dialog first
  const handleRegenerateReflection = async (photoId: string) => {
    const photo = mainPhotos.find(p => p.id === photoId);
    if (!photo) {
      toast({
        title: "Kan inte regenerera",
        description: "Bilden hittades inte",
        variant: "destructive",
      });
      return;
    }

    // Check payment/trial requirements
    if (!hasPaymentMethod) {
      toast({
        title: "Betalmetod krävs",
        description: "Du måste lägga till en betalmetod för att regenerera bilder.",
        variant: "destructive",
      });
      return;
    }

    // Show plate choice dialog before proceeding
    setPendingPlateAction({ type: "regenerate", photoId });
    setPlateChoiceOpen(true);
  };

  // Executes the actual regeneration after plate choice is made
  const executeRegenerateReflection = async (photoId: string, removePlate: boolean) => {
    const photo = mainPhotos.find(p => p.id === photoId);
    if (!photo) return;

    console.log("Regenerating reflection for photo:", photoId, "removePlate:", removePlate);

    // Mark photo as processing
    await supabase
      .from("photos")
      .update({ is_processing: true })
      .eq("id", photoId);

    // Process in background
    (async () => {
      try {
        // Fetch the current composited image
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const file = new File([blob], "composited.jpg", { type: blob.type });

        // Send directly to add-reflection (skip segment and compositing) - now returns URL directly!
        console.log("Regenerate Reflection: Sending to Gemini...");
        const reflectionFormData = new FormData();
        reflectionFormData.append("image_file", file);
        reflectionFormData.append("car_id", car!.id);
        reflectionFormData.append("photo_id", photo.id);
        reflectionFormData.append("remove_plate", removePlate ? "true" : "false");

        const { data: reflectionData, error: reflectionError } = await withTimeout(
          supabase.functions.invoke("add-reflection", { body: reflectionFormData }),
          70000,
          "Reflektioner tog för lång tid, försök igen"
        );

        if (reflectionError) throw reflectionError;
        if (!reflectionData?.url) throw new Error("No URL returned from add-reflection");

        // Final image URL is directly from storage
        const publicUrl = reflectionData.url;

        // Update photo
        await supabase
          .from("photos")
          .update({
            url: publicUrl,
            is_processing: false,
          })
          .eq("id", photoId);

        // Track usage - use regeneration tracking for free first regeneration
        try {
          await trackRegenerationUsage(photoId, car!.id);
        } catch (error) {
          console.error("Error tracking usage:", error);
        }

        successNotification();
      } catch (error) {
        console.error(`Error regenerating reflection ${photoId}:`, error);
        await supabase
          .from("photos")
          .update({ is_processing: false })
          .eq("id", photoId);

        toast({
          title: "Oj!",
          description: "Vår AI fick för många bollar att jonglera",
          variant: "info",
        });
      }
    })();
  };

  // Handler for "Justera bilens position" - opens position editor
  const handleOpenPositionEditor = async (photoId: string) => {
    const photo = mainPhotos.find(p => p.id === photoId);
    if (!photo || !photo.original_url) {
      toast({
        title: "Kan inte justera position",
        description: "Originalbild saknas",
        variant: "destructive",
      });
      return;
    }

    // Check payment/trial requirements
    if (!hasPaymentMethod) {
      toast({
        title: "Betalmetod krävs",
        description: "Du måste lägga till en betalmetod för att redigera bilder.",
        variant: "destructive",
      });
      return;
    }

    try {
      let transparentCarUrl: string;

      // Check if we have cached transparent image
      if (photo.transparent_url) {
        console.log("Position editor: Using cached transparent image");
        transparentCarUrl = photo.transparent_url;
      } else {
        // Need to call segment-car API (now returns URL directly!)
        console.log("Position editor: Segmenting car from original image");

        const response = await fetch(photo.original_url);
        const blob = await response.blob();
        const file = new File([blob], "photo.jpg", { type: blob.type });

        const segmentFormData = new FormData();
        segmentFormData.append("image_file", file);
        segmentFormData.append("car_id", car!.id);
        segmentFormData.append("photo_id", photo.id);

        const { data: segmentData, error: segmentError } = await withTimeout(
          supabase.functions.invoke("segment-car", { body: segmentFormData }),
          60000,
          "Segmentering tog för lång tid, försök igen"
        );

        if (segmentError) throw segmentError;
        if (!segmentData?.url) throw new Error("No URL returned from segment-car");

        // transparent_url is now directly from storage
        const transparentPublicUrl = segmentData.url;

        // Save transparent_url to database
        await supabase
          .from("photos")
          .update({ transparent_url: transparentPublicUrl })
          .eq("id", photoId);

        transparentCarUrl = transparentPublicUrl;
      }

      // For interior photos, check if it was edited with solid color or background image
      if (photo.edit_type === 'interior') {
        if (photo.interior_background_url) {
          // Background image was used - user moves the background
          setPositionEditorPhoto({
            id: photoId,
            transparentCarUrl,
            editType: photo.edit_type,
            backgroundImageUrl: photo.interior_background_url,
            moveBackground: true,
          });
        } else {
          // Solid color was used - user moves the car
          const bgColor = interiorColorHistory[0] || '#c8cfdb';
          setPositionEditorPhoto({
            id: photoId,
            transparentCarUrl,
            editType: photo.edit_type,
            backgroundColor: bgColor,
          });
        }
      } else {
        // Open position editor with transparent car and background image
        setPositionEditorPhoto({
          id: photoId,
          transparentCarUrl,
          editType: photo.edit_type,
        });
      }
    } catch (error) {
      console.error("Error preparing position editor:", error);
      toast({
        title: "Fel vid laddning",
        description: error instanceof Error ? error.message : "Okänt fel",
        variant: "destructive",
      });
    }
  };

  // Handler for position editor save - composites and sends to Gemini (or directly saves for interior)
  const handlePositionEditorSave = async (compositionBlob: Blob) => {
    if (!positionEditorPhoto || !car) return;

    const photoId = positionEditorPhoto.id;
    const isInterior = positionEditorPhoto.editType === 'interior';

    if (isInterior) {
      // Interior photos go directly (no Gemini), no plate dialog needed
      setPositionEditorSaving(true);
      try {
        await supabase.from("photos").update({ is_processing: true }).eq("id", photoId);
        const bgImageUrl = positionEditorPhoto.backgroundImageUrl;
        setPositionEditorPhoto(null);
        setPositionEditorSaving(false);

        const fileName = `interior-${Date.now()}.jpg`;
        const filePath = `edited/${car.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("car-photos").upload(filePath, compositionBlob, { contentType: "image/jpeg", upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("car-photos").getPublicUrl(filePath);
        await supabase.from("photos").update({ url: urlData.publicUrl, is_processing: false, edit_type: 'interior', interior_background_url: bgImageUrl || null }).eq("id", photoId);
        try { await trackRegenerationUsage(photoId, car.id); } catch (e) { console.error("Error tracking usage:", e); }
        successNotification();
      } catch (error) {
        console.error("Error saving positioned image:", error);
        await supabase.from("photos").update({ is_processing: false }).eq("id", photoId);
        toast({ title: "Oj!", description: "Vår AI fick för många bollar att jonglera", variant: "info" });
        setPositionEditorSaving(false);
      }
    } else {
      // Studio photos go through Gemini - show plate choice dialog first
      setPendingPlateAction({ type: "positionSave", compositionBlob, photoId });
      setPositionEditorPhoto(null);
      setPositionEditorSaving(false);
      setPlateChoiceOpen(true);
    }
  };

  // Execute position save for studio photos after plate choice
  const executePositionSave = async (compositionBlob: Blob, photoId: string, removePlate: boolean) => {
    if (!car) return;

    try {
      await supabase.from("photos").update({ is_processing: true }).eq("id", photoId);

      const reflectionFormData = new FormData();
      reflectionFormData.append("image_file", new File([compositionBlob], "composited.jpg", { type: "image/jpeg" }));
      reflectionFormData.append("car_id", car.id);
      reflectionFormData.append("photo_id", photoId);
      reflectionFormData.append("remove_plate", removePlate ? "true" : "false");

      const { data: reflectionData, error: reflectionError } = await withTimeout(
        supabase.functions.invoke("add-reflection", { body: reflectionFormData }),
        70000,
        "Vår AI fick för många bollar att jonglera"
      );

      if (reflectionError) throw reflectionError;
      if (!reflectionData?.url) throw new Error("No URL returned from add-reflection");

      await supabase.from("photos").update({ url: reflectionData.url, is_processing: false }).eq("id", photoId);

      try { await trackRegenerationUsage(photoId, car.id); } catch (e) { console.error("Error tracking usage:", e); }
      successNotification();
    } catch (error) {
      console.error("Error saving positioned image:", error);
      await supabase.from("photos").update({ is_processing: false }).eq("id", photoId);
      toast({ title: "Oj!", description: "Vår AI fick för många bollar att jonglera", variant: "info" });
    }
  };

  // Handler for "Ändra bakgrundsfärg" on interior photos
  const handleChangeInteriorColor = (photoId: string) => {
    setInteriorColorChangePhotoId(photoId);
    setInteriorDialogOpen(true);
  };

  // Modified interior edit handler to support both new edits and color changes
  const handleInteriorEditWithColorChange = async (color: string) => {
    // If we're changing color on a specific photo
    if (interiorColorChangePhotoId) {
      const photo = mainPhotos.find(p => p.id === interiorColorChangePhotoId);
      if (!photo || !photo.transparent_url) {
        toast({
          title: "Kan inte ändra färg",
          description: "Transparent bild saknas",
          variant: "destructive",
        });
        setInteriorColorChangePhotoId(null);
        return;
      }

      // Mark as processing
      await supabase
        .from("photos")
        .update({ is_processing: true })
        .eq("id", interiorColorChangePhotoId);

      setInteriorColorChangePhotoId(null);

      // Process in background
      (async () => {
        try {
          // Composite car on new color
          const compositedBlob = await compositeCarOnSolidColor(
            photo.transparent_url!,
            color
          );

          // Upload
          const fileName = `interior-${Date.now()}.jpg`;
          const filePath = `edited/${car!.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("car-photos")
            .upload(filePath, compositedBlob, {
              contentType: "image/jpeg",
              upsert: true,
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("car-photos")
            .getPublicUrl(filePath);

          const publicUrl = urlData.publicUrl;

          // Update photo
          await supabase
            .from("photos")
            .update({
              url: publicUrl,
              is_processing: false,
              edit_type: 'interior',
            })
            .eq("id", photo.id);

          // Track usage - use regeneration tracking for free first regeneration
          try {
            await trackRegenerationUsage(photo.id, car!.id);
          } catch (error) {
            console.error("Error tracking usage:", error);
          }

          successNotification();
        } catch (error) {
          console.error(`Error changing interior color:`, error);
          await supabase
            .from("photos")
            .update({ is_processing: false })
            .eq("id", photo.id);

          toast({
            title: "Fel vid färgändring",
            description: error instanceof Error ? error.message : "Okänt fel",
            variant: "destructive",
          });
        }
      })();
    } else {
      // Original behavior - edit selected photos
      handleInteriorEdit(color);
    }
  };

  const handleApplyWatermark = async (photoIds: string[], photoType: "main" | "documentation") => {
    setApplyingWatermark(true);
    try {
      // Get user's company_id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Ingen användare inloggad");

      const { data: companyData } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) throw new Error("Kunde inte hitta företag");

      // Get company's settings
      const { data: settings } = await supabase
        .from("ai_settings")
        .select("logo_url, watermark_x, watermark_y, watermark_size, watermark_opacity")
        .eq("company_id", companyData.company_id)
        .single();

      if (!settings?.logo_url) {
        toast({
          title: "Ingen logotyp",
          description: "Du måste ladda upp en logotyp i AI-inställningar först",
          variant: "destructive",
        });
        return;
      }

      // Migration logic: detect old pixel values (> 100) and convert to percentages
      // Old canvas was 3840x2880, so values > 100 are definitely pixels
      const rawX = settings.watermark_x ?? 5;
      const rawY = settings.watermark_y ?? 5;
      const needsMigration = rawX > 100 || rawY > 100;
      
      let watermarkX: number, watermarkY: number;
      if (needsMigration) {
        watermarkX = Math.max(0, Math.min(100, (rawX / 3840) * 100));
        watermarkY = Math.max(0, Math.min(100, (rawY / 2880) * 100));
      } else {
        watermarkX = rawX;
        watermarkY = rawY;
      }

      // Process each photo
      const photosToProcess = photos.filter((p) => photoIds.includes(p.id));

      // Mark all photos as processing BEFORE starting (shows spinner immediately)
      for (const photo of photosToProcess) {
        await supabase
          .from("photos")
          .update({ is_processing: true })
          .eq("id", photo.id);
      }
      // Refresh UI to show spinners
      fetchCarData(true);

      for (const photo of photosToProcess) {
        try {
          // Apply watermark with user's settings
          // Always use current url which contains the edited image from API
          const sourceUrl = photo.url;
          const watermarkedBlob = await applyWatermark(
            sourceUrl,
            settings.logo_url,
            watermarkX,
            watermarkY,
            settings.watermark_size || 15,
            settings.watermark_opacity || 0.8,
          );

          // Upload the watermarked image
          const fileExt = "png";
          const fileName = `watermarked-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${car.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("car-photos")
            .upload(filePath, watermarkedBlob, { upsert: true });

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("car-photos").getPublicUrl(filePath);

          // Update photo record - save original URL if not already saved, track watermark
          const currentPreWatermarkUrl = photo.pre_watermark_url || photo.url;
          await supabase
            .from("photos")
            .update({
              url: publicUrl,
              original_url: photo.original_url || photo.url,
              has_watermark: true,
              pre_watermark_url: currentPreWatermarkUrl,
              watermark_x: watermarkX,
              watermark_y: watermarkY,
              watermark_size: settings.watermark_size || 15,
              watermark_opacity: settings.watermark_opacity || 0.8,
              is_processing: false,
            })
            .eq("id", photo.id);
        } catch (error) {
          // On error, mark as not processing
          await supabase
            .from("photos")
            .update({ is_processing: false })
            .eq("id", photo.id);
          console.error(`Error processing photo ${photo.id}:`, error);
        }
      }

      // Clear selection and refresh
      if (photoType === "main") {
        setSelectedMainPhotos([]);
      } else {
        setSelectedDocPhotos([]);
      }
      fetchCarData(true);
    } catch (error: any) {
      toast({
        title: "Fel vid tillägg av vattenmärke",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApplyingWatermark(false);
    }
  };

  // Handler for removing watermark from a photo
  const handleRemoveWatermark = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo || !photo.pre_watermark_url) {
      toast({
        title: "Kan inte ta bort vattenmärke",
        description: "Originalbilden finns inte sparad",
        variant: "destructive",
      });
      return;
    }

    try {
      await supabase
        .from("photos")
        .update({
          url: photo.pre_watermark_url,
          has_watermark: false,
          pre_watermark_url: null,
          watermark_x: null,
          watermark_y: null,
          watermark_size: null,
          watermark_opacity: null,
        })
        .eq("id", photoId);
      
      fetchCarData(true);
    } catch (error: any) {
      toast({
        title: "Fel vid borttagning av vattenmärke",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handler for opening watermark position editor
  const handleOpenWatermarkEditor = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo || !photo.pre_watermark_url) {
      toast({
        title: "Kan inte justera vattenmärke",
        description: "Originalbilden finns inte sparad",
        variant: "destructive",
      });
      return;
    }

    // Get company logo
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: companyData } = await supabase
      .from("user_companies")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (!companyData) return;

    const { data: settings } = await supabase
      .from("ai_settings")
      .select("logo_url, watermark_x, watermark_y, watermark_size, watermark_opacity")
      .eq("company_id", companyData.company_id)
      .single();

    if (!settings?.logo_url) {
      toast({
        title: "Ingen logotyp",
        description: "Du måste ladda upp en logotyp i inställningarna först",
        variant: "destructive",
      });
      return;
    }

    // Migration logic for settings values
    const rawSettingsX = settings.watermark_x ?? 5;
    const rawSettingsY = settings.watermark_y ?? 5;
    const settingsNeedsMigration = rawSettingsX > 100 || rawSettingsY > 100;
    
    let settingsX: number, settingsY: number;
    if (settingsNeedsMigration) {
      settingsX = Math.max(0, Math.min(100, (rawSettingsX / 3840) * 100));
      settingsY = Math.max(0, Math.min(100, (rawSettingsY / 2880) * 100));
    } else {
      settingsX = rawSettingsX;
      settingsY = rawSettingsY;
    }

    // Migration logic for photo-specific values
    const rawPhotoX = photo.watermark_x;
    const rawPhotoY = photo.watermark_y;
    let photoX: number | undefined, photoY: number | undefined;
    
    if (rawPhotoX !== undefined && rawPhotoY !== undefined) {
      const photoNeedsMigration = rawPhotoX > 100 || rawPhotoY > 100;
      if (photoNeedsMigration) {
        photoX = Math.max(0, Math.min(100, (rawPhotoX / 3840) * 100));
        photoY = Math.max(0, Math.min(100, (rawPhotoY / 2880) * 100));
      } else {
        photoX = rawPhotoX;
        photoY = rawPhotoY;
      }
    }

    setWatermarkEditorPhoto({
      id: photoId,
      preWatermarkUrl: photo.pre_watermark_url,
      logoUrl: settings.logo_url,
      xPercent: photoX ?? settingsX,
      yPercent: photoY ?? settingsY,
      size: photo.watermark_size ?? settings.watermark_size ?? 15,
      opacity: photo.watermark_opacity ?? settings.watermark_opacity ?? 0.8,
    });
  };

  // Handler for saving adjusted watermark position
  const handleSaveWatermarkPosition = async (xPercent: number, yPercent: number, size: number) => {
    if (!watermarkEditorPhoto || !car) return;

    setWatermarkEditorSaving(true);

    try {
      // Re-apply watermark with new position
      const watermarkedBlob = await applyWatermark(
        watermarkEditorPhoto.preWatermarkUrl,
        watermarkEditorPhoto.logoUrl,
        xPercent,
        yPercent,
        size,
        watermarkEditorPhoto.opacity,
      );

      // Upload new watermarked image
      const fileName = `watermarked-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
      const filePath = `${car.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("car-photos")
        .upload(filePath, watermarkedBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("car-photos").getPublicUrl(filePath);

      // Update photo record
      await supabase
        .from("photos")
        .update({
          url: publicUrl,
          watermark_x: xPercent,
          watermark_y: yPercent,
          watermark_size: size,
        })
        .eq("id", watermarkEditorPhoto.id);

      setWatermarkEditorPhoto(null);
      fetchCarData(true);
      successNotification();
    } catch (error: any) {
      toast({
        title: "Fel vid sparande av vattenmärke",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setWatermarkEditorSaving(false);
    }
  };


  // Description generation removed

  const allPhotos = photos;
  const mainPhotos = photos.filter((p) => p.photo_type === "main");
  const docPhotos = photos.filter((p) => p.photo_type === "documentation");

  // Combined selected photos for sharing
  const allSelectedPhotos = [...selectedMainPhotos, ...selectedDocPhotos];

  if (loading) {
    return <CarDetailSkeleton />;
  }

  if (!car) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-0 mb-4 md:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-secondary hover:scale-105 hover:-translate-x-1 transition-all duration-300 group animate-fade-in text-sm md:text-base h-8 md:h-10"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Tillbaka
          </Button>
          <div className="flex gap-1.5 md:gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setSyncDialogOpen(true)}
              className="hover:scale-105 transition-all duration-300 flex-1 sm:flex-none text-xs md:text-sm h-8 md:h-10"
            >
              Synka
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="hover:scale-105 transition-all duration-300 flex-1 sm:flex-none text-xs md:text-sm h-8 md:h-10"
            >
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden xs:inline">Ta bort bil</span>
              <span className="xs:hidden">Ta bort</span>
            </Button>
          </div>
        </div>

        {/* Car Info Card */}
        <Card className="mb-4 md:mb-8 bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all duration-500 animate-scale-in">
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg md:text-2xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                {car.make} {car.model}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditDialogOpen(true)}
                className="hover:scale-110 transition-transform duration-300 h-8 w-8 md:h-10 md:w-10 shrink-0"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                  <p className="text-sm md:text-base text-muted-foreground font-medium">
                    Anteckningar (delat med företaget)
                  </p>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="bg-gradient-button hover:bg-gradient-hover text-xs md:text-sm h-8 md:h-9"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Spara
                  </Button>
                </div>
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Lägg till anteckningar om bilen här..."
                  className="min-h-[100px] text-sm md:text-base"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">
            <TabsList className="bg-card border border-border shadow-card w-full sm:w-auto">
              <TabsTrigger
                value="main"
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300 text-xs md:text-sm flex-1 sm:flex-none"
              >
                <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Huvudfoton</span> ({mainPhotos.length})
              </TabsTrigger>
              <TabsTrigger
                value="docs"
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300 text-xs md:text-sm flex-1 sm:flex-none"
              >
                <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Dokumentation</span> ({docPhotos.length})
              </TabsTrigger>
            </TabsList>

            <div className="min-h-12 sm:min-h-0 lg:ml-auto w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                {allSelectedPhotos.length > 0 && (
                  <>
                    <Button
                      onClick={() => handleSharePhotos(allSelectedPhotos)}
                      variant="outline"
                      disabled={sharing}
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs md:text-sm h-12 md:h-10 w-full sm:w-auto sm:shrink-0 whitespace-nowrap"
                    >
                      <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                      {sharing ? "Skapar länk..." : `Dela (${allSelectedPhotos.length})`}
                    </Button>
                    <Button
                      onClick={() => handleDownloadPhotos(allSelectedPhotos)}
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs md:text-sm h-12 md:h-10 w-full sm:w-auto sm:shrink-0 whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                      Ladda ned ({allSelectedPhotos.length})
                    </Button>
                  </>
                )}
                {activeTab === "main" && selectedMainPhotos.length > 0 && (
                  <>
                    <Button
                      onClick={() => setInteriorBackgroundDialogOpen(true)}
                      variant="outline"
                      className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white text-xs md:text-sm h-12 md:h-10 w-full sm:w-auto sm:shrink-0 whitespace-nowrap"
                    >
                      <Palette className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                      <span className="hidden sm:inline">Interiör ({selectedMainPhotos.length})</span>
                      <span className="sm:hidden">Interiör ({selectedMainPhotos.length})</span>
                    </Button>
                    <Button
                      onClick={() => {
                        setPendingEditPhotos({ ids: selectedMainPhotos, type: "main" });
                        setPlateChoiceOpen(true);
                      }}
                      variant="outline"
                      className="border-accent text-accent hover:bg-accent hover:text-accent-foreground text-xs md:text-sm h-12 md:h-10 w-full sm:w-auto sm:shrink-0 whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                      <span className="hidden sm:inline">AI redigera ({selectedMainPhotos.length})</span>
                      <span className="sm:hidden">AI ({selectedMainPhotos.length})</span>
                    </Button>
                    <Button
                      onClick={() => handleApplyWatermark(selectedMainPhotos, "main")}
                      variant="outline"
                      disabled={applyingWatermark}
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs md:text-sm h-12 md:h-10 w-full sm:w-auto sm:shrink-0 whitespace-nowrap"
                    >
                      <Stamp className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                      {applyingWatermark ? (
                        "Lägger till..."
                      ) : (
                        <>
                          <span className="hidden sm:inline">Lägg till vattenmärke ({selectedMainPhotos.length})</span>
                          <span className="sm:hidden">Vattenmärke ({selectedMainPhotos.length})</span>
                        </>
                      )}
                    </Button>
                  </>
                )}
                {activeTab === "docs" && selectedDocPhotos.length > 0 && (
                  <Button
                    onClick={() => handleApplyWatermark(selectedDocPhotos, "documentation")}
                    variant="outline"
                    disabled={applyingWatermark}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs md:text-sm h-12 md:h-10 w-full sm:w-auto sm:shrink-0 whitespace-nowrap"
                  >
                    <Stamp className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                    {applyingWatermark ? (
                      "Lägger till..."
                    ) : (
                      <>
                        <span className="hidden sm:inline">Lägg till vattenmärke ({selectedDocPhotos.length})</span>
                        <span className="sm:hidden">Vattenmärke ({selectedDocPhotos.length})</span>
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUploadType(activeTab === "main" ? "main" : "documentation");
                    setUploadDialogOpen(true);
                  }}
                  className="bg-gradient-button hover:bg-gradient-hover shadow-glow hover:shadow-intense hover:scale-105 transition-all duration-300 text-xs md:text-sm h-12 md:h-10 relative z-10 touch-manipulation w-full sm:w-auto sm:shrink-0 whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">
                    {activeTab === "main" ? "Ladda upp huvudfoton" : "Ladda upp dokumentation"}
                  </span>
                  <span className="sm:hidden">Ladda upp</span>
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="main" className="space-y-4 md:space-y-6">
            <div className="h-8 pointer-events-none" />
            <PhotoGalleryDraggable
              photos={mainPhotos}
              onUpdate={() => fetchCarData(true)}
              selectedPhotos={selectedMainPhotos}
              onSelectionChange={setSelectedMainPhotos}
              onRegenerateReflection={handleRegenerateReflection}
              onAdjustPosition={handleOpenPositionEditor}
              onRemoveWatermark={handleRemoveWatermark}
              onAdjustWatermark={handleOpenWatermarkEditor}
              onChangeInteriorColor={handleChangeInteriorColor}
            />
          </TabsContent>

          <TabsContent value="docs" className="space-y-4 md:space-y-6">
            <div className="h-8 pointer-events-none" />
            <PhotoGalleryDraggable
              photos={docPhotos}
              onUpdate={() => fetchCarData(true)}
              selectedPhotos={selectedDocPhotos}
              onSelectionChange={setSelectedDocPhotos}
              onRemoveWatermark={handleRemoveWatermark}
              onAdjustWatermark={handleOpenWatermarkEditor}
            />
          </TabsContent>
        </Tabs>
      </div>

      <PhotoUpload
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        carId={id!}
        photoType={uploadType}
        onUploadComplete={() => fetchCarData(true)}
      />

      {/* Watermark Position Editor */}
      {watermarkEditorPhoto && (
        <WatermarkPositionEditor
          imageUrl={watermarkEditorPhoto.preWatermarkUrl}
          logoUrl={watermarkEditorPhoto.logoUrl}
          initialXPercent={watermarkEditorPhoto.xPercent}
          initialYPercent={watermarkEditorPhoto.yPercent}
          initialSize={watermarkEditorPhoto.size}
          opacity={watermarkEditorPhoto.opacity}
          onSave={handleSaveWatermarkPosition}
          onCancel={() => setWatermarkEditorPhoto(null)}
          saving={watermarkEditorSaving}
        />
      )}
      {/* Delete/Archive Choice Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Vad vill du göra med bilen?</AlertDialogTitle>
            <AlertDialogDescription>
              {car?.deleted_at 
                ? "Bilen är arkiverad. Du kan avarkivera den eller radera permanent."
                : "Välj om du vill arkivera bilen (dölj från startsidan) eller radera den permanent."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                handleArchiveCar();
              }}
            >
              {car?.deleted_at ? "Avarkivera" : "Arkivera"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteDialogOpen(false);
                setConfirmDeleteOpen(true);
              }}
            >
              Radera permanent
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Permanent Delete Dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Är du helt säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer <strong>permanent radera</strong> bilen och alla tillhörande foton. Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ja, radera permanent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {car && (
        <EditCarDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          car={car}
          onCarUpdated={() => fetchCarData(true)}
        />
      )}

      {car && <PlatformSyncDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen} carId={car.id} car={car} photos={photos.filter(p => p.photo_type === "main")} />}
      
      {/* Car Position Editor */}
      <CarPositionEditor
        open={!!positionEditorPhoto}
        onOpenChange={(open) => !open && setPositionEditorPhoto(null)}
        transparentCarUrl={positionEditorPhoto?.transparentCarUrl || ""}
        backgroundUrl={positionEditorPhoto?.backgroundImageUrl || backgroundUrl}
        backgroundColor={positionEditorPhoto?.backgroundColor}
        isInterior={positionEditorPhoto?.editType === 'interior'}
        moveBackground={positionEditorPhoto?.moveBackground}
        fillCanvas={positionEditorPhoto?.moveBackground || (positionEditorPhoto?.editType === 'interior' && !!positionEditorPhoto?.backgroundColor)}
        onSave={handlePositionEditorSave}
        isSaving={positionEditorSaving}
      />

      {/* Interior Background Selection Dialog */}
      <InteriorBackgroundDialog
        open={interiorBackgroundDialogOpen}
        onOpenChange={setInteriorBackgroundDialogOpen}
        onSolidColorSelected={() => setInteriorDialogOpen(true)}
        onImageSelected={(imageUrl) => {
          // For image background, we need to segment first then open position editor
          const photoIds = selectedMainPhotos;
          if (photoIds.length === 0) return;
          
          // For now, use the first selected photo and open position editor with moveBackground
          const photoId = photoIds[0];
          const photo = mainPhotos.find(p => p.id === photoId);
          if (!photo) return;
          
          // If photo already has transparent_url, use it directly
          if (photo.transparent_url) {
            setPositionEditorPhoto({
              id: photoId,
              transparentCarUrl: photo.transparent_url,
              editType: 'interior',
              backgroundImageUrl: imageUrl,
              moveBackground: true,
            });
            setSelectedMainPhotos([]);
          } else {
            // Need to segment first - show toast that we're processing
            toast({
              title: "Förbereder...",
              description: "Tar bort bakgrunden först, vänta...",
            });
            // Segment then open editor
            (async () => {
              try {
                const response = await fetch(photo.url);
                const blob = await response.blob();
                const file = new File([blob], "photo.jpg", { type: blob.type });
                
                const segmentFormData = new FormData();
                segmentFormData.append("image_file", file);
                segmentFormData.append("car_id", car!.id);
                segmentFormData.append("photo_id", photo.id);
                
                const { data: segmentData, error: segmentError } = await withTimeout(
                  supabase.functions.invoke("segment-car", { body: segmentFormData }),
                  60000, // 60 sekunders timeout
                  "Vår AI fick för många bollar att jonglera"
                );
                
                if (segmentError) throw segmentError;
                if (!segmentData?.url) throw new Error("No URL returned");
                
                // Save transparent_url
                await supabase
                  .from("photos")
                  .update({ transparent_url: segmentData.url, original_url: photo.url })
                  .eq("id", photoId);
                
                setPositionEditorPhoto({
                  id: photoId,
                  transparentCarUrl: segmentData.url,
                  editType: 'interior',
                  backgroundImageUrl: imageUrl,
                  moveBackground: true,
                });
                setSelectedMainPhotos([]);
              } catch (error) {
                console.error("Error segmenting for interior image:", error);
                toast({
                  title: "Fel",
                  description: "Kunde inte förbereda bilden",
                  variant: "destructive",
                });
              }
            })();
          }
        }}
        availableBackgrounds={availableInteriorBackgrounds}
        isProcessing={processingInterior}
      />

      {/* Interior Color Dialog */}
      <InteriorColorDialog
        open={interiorDialogOpen}
        onOpenChange={(open) => {
          setInteriorDialogOpen(open);
          if (!open) setInteriorColorChangePhotoId(null);
        }}
        onColorSelected={handleInteriorEditWithColorChange}
        colorHistory={interiorColorHistory}
        isProcessing={processingInterior}
      />

      {/* License Plate Choice Dialog */}
      <LicensePlateChoiceDialog
        open={plateChoiceOpen}
        onChoice={(removePlate) => {
          setPlateChoiceOpen(false);
          if (pendingEditPhotos) {
            handleEditPhotos(pendingEditPhotos.ids, pendingEditPhotos.type, removePlate);
            setPendingEditPhotos(null);
          } else if (pendingPlateAction?.type === "regenerate") {
            const photoId = pendingPlateAction.photoId;
            setPendingPlateAction(null);
            executeRegenerateReflection(photoId, removePlate);
          } else if (pendingPlateAction?.type === "positionSave") {
            const { compositionBlob, photoId } = pendingPlateAction;
            setPendingPlateAction(null);
            executePositionSave(compositionBlob, photoId, removePlate);
          }
        }}
        onCancel={() => {
          setPlateChoiceOpen(false);
          setPendingEditPhotos(null);
          setPendingPlateAction(null);
        }}
      />
    </div>
  );
};

export default CarDetail;
