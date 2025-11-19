import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGalleryDraggable from "@/components/PhotoGalleryDraggable";
import { PlatformSyncDialog } from "@/components/PlatformSyncDialog";
import EditCarDialog from "@/components/EditCarDialog";
import { applyWatermark } from "@/lib/watermark";
import { trackUsage } from "@/lib/usageTracking";
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
}

interface Photo {
  id: string;
  url: string;
  photo_type: "main" | "documentation";
  is_edited: boolean;
  is_processing?: boolean;
  original_url: string | null;
  display_order: number;
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
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchCarData();

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
            console.log('Photo update received:', payload);
            // Update photos in real-time
            fetchCarData(true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const fetchCarData = async (preserveScroll = false) => {
    // Save current scroll position if requested
    const scrollY = preserveScroll ? window.scrollY : 0;

    setLoading(true);
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
      toast({ title: "Bil raderad" });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Fel vid radering av bil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSharePhotos = async (photoIds: string[]) => {
    if (photoIds.length === 0) return;

    setSharing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Ingen användare inloggad");

      // Generate unique share token
      const { data: tokenData, error: tokenError } = await supabase.rpc("generate_share_token");
      if (tokenError) throw tokenError;

      // Create shared collection
      const { error } = await supabase.from("shared_collections").insert({
        user_id: user.id,
        title: `${car.make} ${car.model} ${car.year}`,
        photo_ids: photoIds,
        share_token: tokenData,
      });

      if (error) throw error;

      // Generate shareable URL
      const shareUrl = `${window.location.origin}/shared/${tokenData}`;

      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Delningslänk skapad!",
        description: "Länken har kopierats till urklipp",
      });

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
      toast({ title: "Anteckningar sparade" });
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

  const handleEditPhotos = async (photoIds: string[], photoType: "main" | "documentation") => {
    const photos = photoType === "main" ? mainPhotos : docPhotos;

    // Check if we already have 20 edited images
    const editedCount = allPhotos.filter(p => p.is_edited).length;
    if (editedCount >= 20) {
      toast({
        title: "Max antal redigerade bilder",
        description: "Du kan max redigera 20 bilder per bil",
        variant: "destructive",
      });
      return;
    }

    // Check if adding these would exceed 20
    if (editedCount + photoIds.length > 20) {
      toast({
        title: "För många bilder",
        description: `Du kan endast redigera ${20 - editedCount} bilder till`,
        variant: "destructive",
      });
      return;
    }

    // Clear selection immediately
    if (photoType === "main") {
      setSelectedMainPhotos([]);
    } else {
      setSelectedDocPhotos([]);
    }

    // Track usage once per car (only first time)
    try {
      await trackUsage("car_with_edited_images", car!.id);
    } catch (error) {
      console.error("Error tracking usage:", error);
    }

    // Show toast immediately
    toast({
      title: "Bearbetar bilder",
      description: "Dina bilder bearbetas i bakgrunden",
    });

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
          // Call edit-photo edge function
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const file = new File([blob], "photo.jpg", { type: blob.type });

          const formData = new FormData();
          formData.append("image_file", file);

          const { data, error } = await supabase.functions.invoke("edit-photo", {
            body: formData,
          });

          if (error) throw error;

          // Convert base64 to blob
          const base64 = data.image;
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const editedBlob = new Blob([bytes], { type: "image/png" });

          // Upload edited image
          const editedFileName = `${car!.id}/edited-${Date.now()}-${Math.random()}.png`;
          const { error: uploadError } = await supabase.storage
            .from("car-photos")
            .upload(editedFileName, editedBlob, { upsert: true });

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("car-photos").getPublicUrl(editedFileName);

          // Update photo - realtime will handle UI update
          await supabase
            .from("photos")
            .update({
              url: publicUrl,
              original_url: photo.url,
              is_edited: true,
              is_processing: false,
            })
            .eq("id", photo.id);
        } catch (error) {
          console.error(`Error editing photo ${photo.id}:`, error);
          // Clear processing state on error
          await supabase
            .from("photos")
            .update({ is_processing: false })
            .eq("id", photo.id);
          
          toast({
            title: "Fel vid redigering",
            description: `Kunde inte redigera bild: ${error instanceof Error ? error.message : "Okänt fel"}`,
            variant: "destructive",
          });
        }
      })();
    });
  };

  const handleApplyWatermark = async (photoIds: string[], photoType: "main" | "documentation") => {
    setApplyingWatermark(true);
    try {
      // Get user's settings
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Ingen användare inloggad");

      const { data: settings } = await supabase
        .from("ai_settings")
        .select("logo_url, watermark_x, watermark_y, watermark_size, watermark_opacity")
        .eq("user_id", user.id)
        .single();

      if (!settings?.logo_url) {
        toast({
          title: "Ingen logotyp",
          description: "Du måste ladda upp en logotyp i AI-inställningar först",
          variant: "destructive",
        });
        return;
      }

      // Process each photo
      const photosToProcess = photos.filter((p) => photoIds.includes(p.id));

      for (const photo of photosToProcess) {
        try {
          // Apply watermark with user's settings
          const watermarkedBlob = await applyWatermark(
            photo.url,
            settings.logo_url,
            settings.watermark_x || 20,
            settings.watermark_y || 20,
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

          // Update photo record
          await supabase
            .from("photos")
            .update({
              url: publicUrl,
              original_url: photo.original_url || photo.url,
              is_edited: true,
            })
            .eq("id", photo.id);
        } catch (error) {
          console.error(`Error processing photo ${photo.id}:`, error);
        }
      }

      toast({
        title: "Vattenmärke tillagt",
        description: `${photosToProcess.length} bilder har uppdaterats`,
      });

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

  const handleRemoveWatermark = async (photoIds: string[], photoType: "main" | "documentation") => {
    setApplyingWatermark(true);
    try {
      // Only allow removing watermark, not restoring original_url for edited photos
      const photosToProcess = photos.filter((p) => photoIds.includes(p.id) && p.original_url);

      if (photosToProcess.length === 0) {
        toast({
          title: "Inga bilder att ta bort vattenmärke från",
          variant: "destructive",
        });
        return;
      }

      for (const photo of photosToProcess) {
        try {
          // Only restore to original URL, keep is_edited status
          await supabase
            .from("photos")
            .update({
              url: photo.original_url,
            })
            .eq("id", photo.id);
        } catch (error) {
          console.error(`Error removing watermark from photo ${photo.id}:`, error);
        }
      }

      toast({
        title: "Vattenmärke borttaget",
        description: `${photosToProcess.length} bilder har återställts`,
      });

      // Clear selection and refresh
      if (photoType === "main") {
        setSelectedMainPhotos([]);
      } else {
        setSelectedDocPhotos([]);
      }
      fetchCarData(true);
    } catch (error: any) {
      toast({
        title: "Fel vid borttagning av vattenmärke",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApplyingWatermark(false);
    }
  };

  const handleGenerateDescription = async () => {
    setGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-car-description", {
        body: { carId: car!.id },
      });

      if (error) throw error;

      // Update car with generated description
      const { error: updateError } = await supabase
        .from("cars")
        .update({ description: data.description })
        .eq("id", car!.id);

      if (updateError) throw updateError;

      // Track usage
      await trackUsage("generate_description");

      toast({
        title: "Beskrivning genererad!",
        description: "AI-beskrivningen har skapats",
      });

      fetchCarData(true);
    } catch (error: any) {
      toast({
        title: "Fel vid generering",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const allPhotos = photos;
  const mainPhotos = photos.filter((p) => p.photo_type === "main");
  const docPhotos = photos.filter((p) => p.photo_type === "documentation");
  const editedPhotosCount = photos.filter((p) => p.is_edited).length;

  // Check if selected photos have watermarks (original_url exists)
  const allSelectedMainHaveWatermark =
    selectedMainPhotos.length > 0 && selectedMainPhotos.every((id) => photos.find((p) => p.id === id)?.original_url);

  const allSelectedDocHaveWatermark =
    selectedDocPhotos.length > 0 && selectedDocPhotos.every((id) => photos.find((p) => p.id === id)?.original_url);

  // Combined selected photos for sharing
  const allSelectedPhotos = [...selectedMainPhotos, ...selectedDocPhotos];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-0 mb-4 md:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
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
                {car.year} {car.make} {car.model}
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
              {car.registration_number && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground font-medium mb-2">🚗 Registreringsnummer</p>
                  <p className="text-base">{car.registration_number}</p>
                </div>
              )}
              {car.description && (
                <div className="rounded-lg border bg-card shadow-sm">
                  <Collapsible
                    open={descriptionOpen}
                    onOpenChange={setDescriptionOpen}
                  >
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors">
                      <p className="text-sm text-muted-foreground font-medium">📝 Beskrivning</p>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                          descriptionOpen ? "rotate-180" : ""
                        }`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <p className="whitespace-pre-wrap text-base pt-2">{car.description}</p>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="px-4 pb-4">
                    <Button
                      onClick={handleGenerateDescription}
                      disabled={generatingDescription}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {generatingDescription ? "Genererar..." : "Generera ny AI-beskrivning"}
                    </Button>
                  </div>
                </div>
              )}
              {!car.description && (
                <div className="rounded-lg border bg-card shadow-sm p-4">
                  <p className="text-sm text-muted-foreground font-medium mb-2">📝 Beskrivning</p>
                  <p className="text-sm text-muted-foreground mb-3">Ingen beskrivning finns ännu</p>
                  <Button
                    onClick={handleGenerateDescription}
                    disabled={generatingDescription}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generatingDescription ? "Genererar..." : "Generera AI-beskrivning"}
                  </Button>
                </div>
              )}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                  <p className="text-sm md:text-base text-muted-foreground font-medium">
                    Anteckningar (delat med företaget)
                  </p>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="bg-gradient-primary hover:opacity-90 text-xs md:text-sm h-8 md:h-9"
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

        {/* Edited Images Counter */}
        <Card className="mb-4 bg-gradient-card border-border/50 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Redigerade bilder</span>
              </div>
              <div className="text-lg font-bold">
                {editedPhotosCount} / 20
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

            <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto">
              {allSelectedPhotos.length > 0 && (
                <Button
                  onClick={() => handleSharePhotos(allSelectedPhotos)}
                  variant="outline"
                  disabled={sharing}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs md:text-sm h-8 md:h-10"
                >
                  <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  {sharing ? "Skapar länk..." : `Dela (${allSelectedPhotos.length})`}
                </Button>
              )}
              {activeTab === "main" && selectedMainPhotos.length > 0 && (
                <>
                  <Button
                    onClick={() => handleEditPhotos(selectedMainPhotos, "main")}
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent hover:text-accent-foreground text-xs md:text-sm h-8 md:h-10"
                  >
                    <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">AI redigera ({selectedMainPhotos.length})</span>
                    <span className="sm:hidden">AI ({selectedMainPhotos.length})</span>
                  </Button>
                  <Button
                    onClick={() =>
                      allSelectedMainHaveWatermark
                        ? handleRemoveWatermark(selectedMainPhotos, "main")
                        : handleApplyWatermark(selectedMainPhotos, "main")
                    }
                    variant="outline"
                    disabled={applyingWatermark}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs md:text-sm h-8 md:h-10"
                  >
                    <Stamp className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                    {applyingWatermark ? (
                      allSelectedMainHaveWatermark ? (
                        "Tar bort..."
                      ) : (
                        "Lägger till..."
                      )
                    ) : allSelectedMainHaveWatermark ? (
                      <>
                        <span className="hidden sm:inline">Ta bort vattenmärke ({selectedMainPhotos.length})</span>
                        <span className="sm:hidden">Ta bort ({selectedMainPhotos.length})</span>
                      </>
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
                  onClick={() =>
                    allSelectedDocHaveWatermark
                      ? handleRemoveWatermark(selectedDocPhotos, "documentation")
                      : handleApplyWatermark(selectedDocPhotos, "documentation")
                  }
                  variant="outline"
                  disabled={applyingWatermark}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs md:text-sm h-8 md:h-10"
                >
                  <Stamp className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  {applyingWatermark ? (
                    allSelectedDocHaveWatermark ? (
                      "Tar bort..."
                    ) : (
                      "Lägger till..."
                    )
                  ) : allSelectedDocHaveWatermark ? (
                    <>
                      <span className="hidden sm:inline">Ta bort vattenmärke ({selectedDocPhotos.length})</span>
                      <span className="sm:hidden">Ta bort ({selectedDocPhotos.length})</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Lägg till vattenmärke ({selectedDocPhotos.length})</span>
                      <span className="sm:hidden">Vattenmärke ({selectedDocPhotos.length})</span>
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={() => {
                  setUploadType(activeTab === "main" ? "main" : "documentation");
                  setUploadDialogOpen(true);
                }}
                className="bg-gradient-primary hover:bg-gradient-hover shadow-glow hover:shadow-intense hover:scale-105 transition-all duration-300 text-xs md:text-sm h-8 md:h-10"
              >
                <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                <span className="hidden sm:inline">
                  {activeTab === "main" ? "Ladda upp huvudfoton" : "Ladda upp dokumentation"}
                </span>
                <span className="sm:hidden">Ladda upp</span>
              </Button>
            </div>
          </div>

          <TabsContent value="main" className="space-y-4 md:space-y-6">
            <PhotoGalleryDraggable
              photos={mainPhotos}
              onUpdate={() => fetchCarData(true)}
              selectedPhotos={selectedMainPhotos}
              onSelectionChange={setSelectedMainPhotos}
            />
          </TabsContent>

          <TabsContent value="docs" className="space-y-4 md:space-y-6">
            <PhotoGalleryDraggable
              photos={docPhotos}
              onUpdate={() => fetchCarData(true)}
              selectedPhotos={selectedDocPhotos}
              onSelectionChange={setSelectedDocPhotos}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer permanent radera bilen och alla tillhörande foton. Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ta bort
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
    </div>
  );
};

export default CarDetail;
