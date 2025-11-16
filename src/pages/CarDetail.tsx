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
  const [editingPhotos, setEditingPhotos] = useState<Record<string, { timeLeft: number; isEditing: boolean }>>({});
  const [pendingEdits, setPendingEdits] = useState<Record<string, { publicUrl: string; completeAt: Date }>>({});
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchCarData();
    }
  }, [id]);

  // Handle timers for editing photos
  useEffect(() => {
    const intervals = new Map<string, NodeJS.Timeout>();

    Object.entries(editingPhotos).forEach(([photoId, state]) => {
      if (state.isEditing && state.timeLeft > 0) {
        // Only create timer if one doesn't exist for this photo
        if (!intervals.has(photoId)) {
          const intervalId = setInterval(() => {
            setEditingPhotos((prev) => {
              const current = prev[photoId];
              if (!current || current.timeLeft <= 1) {
                clearInterval(intervalId);
                fetchCarData(true);
                return prev;
              }
              return {
                ...prev,
                [photoId]: { ...current, timeLeft: current.timeLeft - 1 },
              };
            });
          }, 1000);
          intervals.set(photoId, intervalId);
        }
      }
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [
    Object.keys(editingPhotos)
      .filter((id) => editingPhotos[id].isEditing)
      .join(","),
  ]);

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

      // Fetch pending edits for this car's photos
      const photoIds = (photosData || []).map((p: any) => p.id);
      if (photoIds.length > 0) {
        const { data: pendingData } = await supabase
          .from("pending_photo_edits")
          .select("*")
          .in("photo_id", photoIds)
          .eq("completed", false);

        if (pendingData && pendingData.length > 0) {
          const newPendingEdits: Record<string, { publicUrl: string; completeAt: Date }> = {};
          const newEditingState: Record<string, { timeLeft: number; isEditing: boolean }> = {};

          pendingData.forEach((edit: any) => {
            const completeAt = new Date(edit.complete_at);
            const now = new Date();
            const timeLeftSeconds = Math.max(0, Math.floor((completeAt.getTime() - now.getTime()) / 1000));

            newPendingEdits[edit.photo_id] = {
              publicUrl: edit.edited_url,
              completeAt: completeAt,
            };

            newEditingState[edit.photo_id] = {
              timeLeft: timeLeftSeconds,
              isEditing: timeLeftSeconds > 0,
            };
          });

          setPendingEdits(newPendingEdits);
          setEditingPhotos(newEditingState);
        } else {
          setPendingEdits({});
          setEditingPhotos({});
        }
      }

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
    // Initialize countdown timers for selected photos
    const newEditingState: Record<string, { timeLeft: number; isEditing: boolean }> = {};
    photoIds.forEach((id) => {
      newEditingState[id] = { timeLeft: 240, isEditing: true }; // 4 minutes = 240 seconds
    });
    setEditingPhotos((prev) => ({ ...prev, ...newEditingState }));

    // Start countdown for each photo
    const intervalIds: Record<string, ReturnType<typeof setInterval>> = {};
    photoIds.forEach((photoId) => {
      const intervalId = setInterval(() => {
        setEditingPhotos((prev) => {
          const current = prev[photoId];
          if (!current || current.timeLeft <= 1) {
            clearInterval(intervalId);
            // Just refresh data - the cron job will update the database
            fetchCarData(true);
            return prev;
          }
          return {
            ...prev,
            [photoId]: { ...current, timeLeft: current.timeLeft - 1 },
          };
        });
      }, 1000);
      intervalIds[photoId] = intervalId;
    });

    // Process photos with API
    try {
      const photosToProcess = photos.filter((p) => photoIds.includes(p.id));

      for (const photo of photosToProcess) {
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
          const editedFileName = `${car.id}/edited-${Date.now()}-${Math.random()}.png`;
          const { error: uploadError } = await supabase.storage
            .from("car-photos")
            .upload(editedFileName, editedBlob, { upsert: true });

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("car-photos").getPublicUrl(editedFileName);

          // Calculate completion time (4 minutes from now)
          const completeAt = new Date(Date.now() + 240000); // 240 seconds = 4 minutes

          // Store the edited URL in database pending_photo_edits
          await supabase.from("pending_photo_edits").insert({
            photo_id: photo.id,
            edited_url: publicUrl,
            complete_at: completeAt.toISOString(),
          });

          // Track usage for image edit
          await trackUsage("edit_image");

          // Also store in local state for UI
          setPendingEdits((prev) => ({
            ...prev,
            [photo.id]: { publicUrl, completeAt },
          }));
        } catch (error) {
          console.error(`Error editing photo ${photo.id}:`, error);
          // Clear the timer if there's an error
          if (intervalIds[photo.id]) {
            clearInterval(intervalIds[photo.id]);
          }
          setEditingPhotos((prev) => {
            const newState = { ...prev };
            delete newState[photo.id];
            return newState;
          });
        }
      }

      // Clear selection
      if (photoType === "main") {
        setSelectedMainPhotos([]);
      } else {
        setSelectedDocPhotos([]);
      }
    } catch (error: any) {
      toast({
        title: "Fel vid redigering av bilder",
        description: error.message,
        variant: "destructive",
      });
    }
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
      const photosToProcess = photos.filter((p) => photoIds.includes(p.id) && p.is_edited && p.original_url);

      if (photosToProcess.length === 0) {
        toast({
          title: "Inga bilder att återställa",
          description: "De valda bilderna har inget originalfoto att återställa till",
          variant: "destructive",
        });
        return;
      }

      for (const photo of photosToProcess) {
        try {
          // Restore to original URL
          await supabase
            .from("photos")
            .update({
              url: photo.original_url,
              is_edited: false,
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

  const mainPhotos = photos.filter((p) => p.photo_type === "main");
  const docPhotos = photos.filter((p) => p.photo_type === "documentation");

  // Check if all selected photos are edited (have watermarks)
  const allSelectedMainAreEdited =
    selectedMainPhotos.length > 0 && selectedMainPhotos.every((id) => photos.find((p) => p.id === id)?.is_edited);

  const allSelectedDocAreEdited =
    selectedDocPhotos.length > 0 && selectedDocPhotos.every((id) => photos.find((p) => p.id === id)?.is_edited);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {car.price && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground font-medium mb-2">💰 Pris</p>
                  <p className="font-semibold text-lg">{car.price.toLocaleString()} SEK</p>
                </div>
              )}
              {car.registration_number && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground font-medium mb-2">🚗 Registreringsnummer</p>
                  <p className="text-base">{car.registration_number}</p>
                </div>
              )}
              {car.vin && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground font-medium mb-2">🔢 Reg.nr</p>
                  <p className="text-base">{car.vin}</p>
                </div>
              )}
              {car.color && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground font-medium mb-2">🎨 Färg</p>
                  <p className="text-base">{car.color}</p>
                </div>
              )}
              {car.mileage && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground font-medium mb-2">📏 Miltal</p>
                  <p className="text-base">{car.mileage.toLocaleString()} km</p>
                </div>
              )}
              {car.fuel && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground font-medium mb-2">⛽ Bränsle</p>
                  <p className="text-base">{car.fuel}</p>
                </div>
              )}
              {car.gearbox && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground font-medium mb-2">⚙️ Växellåda</p>
                  <p className="text-base">{car.gearbox}</p>
                </div>
              )}
              {car.description && (
                <Collapsible
                  open={descriptionOpen}
                  onOpenChange={setDescriptionOpen}
                  className="sm:col-span-2 lg:col-span-3 rounded-lg border bg-card shadow-sm"
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
              )}
              <div className="sm:col-span-2 lg:col-span-3">
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
                      allSelectedMainAreEdited
                        ? handleRemoveWatermark(selectedMainPhotos, "main")
                        : handleApplyWatermark(selectedMainPhotos, "main")
                    }
                    variant="outline"
                    disabled={applyingWatermark}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs md:text-sm h-8 md:h-10"
                  >
                    <Stamp className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                    {applyingWatermark ? (
                      allSelectedMainAreEdited ? (
                        "Tar bort..."
                      ) : (
                        "Lägger till..."
                      )
                    ) : allSelectedMainAreEdited ? (
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
                    allSelectedDocAreEdited
                      ? handleRemoveWatermark(selectedDocPhotos, "documentation")
                      : handleApplyWatermark(selectedDocPhotos, "documentation")
                  }
                  variant="outline"
                  disabled={applyingWatermark}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs md:text-sm h-8 md:h-10"
                >
                  <Stamp className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  {applyingWatermark ? (
                    allSelectedDocAreEdited ? (
                      "Tar bort..."
                    ) : (
                      "Lägger till..."
                    )
                  ) : allSelectedDocAreEdited ? (
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
              editingPhotos={editingPhotos}
            />
          </TabsContent>

          <TabsContent value="docs" className="space-y-4 md:space-y-6">
            <PhotoGalleryDraggable
              photos={docPhotos}
              onUpdate={() => fetchCarData(true)}
              selectedPhotos={selectedDocPhotos}
              onSelectionChange={setSelectedDocPhotos}
              editingPhotos={editingPhotos}
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
