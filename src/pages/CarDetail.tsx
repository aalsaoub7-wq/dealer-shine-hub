import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Image as ImageIcon, FileText, Trash2, Save, Settings, Share2, Stamp, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGalleryDraggable from "@/components/PhotoGalleryDraggable";
import { BlocketSyncButton } from "@/components/BlocketSyncButton";
import EditCarDialog from "@/components/EditCarDialog";
import { applyWatermark } from "@/lib/watermark";
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
  const [applyingWatermark, setApplyingWatermark] = useState(false);
  const [editingPhotos, setEditingPhotos] = useState<Record<string, { timeLeft: number; isEditing: boolean }>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchCarData();
    }
  }, [id]);

  const fetchCarData = async () => {
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

  const handleSharePhotos = (photoIds: string[]) => {
    const photoUrls = photos
      .filter(p => photoIds.includes(p.id))
      .map(p => p.url)
      .join('\n');
    
    navigator.clipboard.writeText(photoUrls);
    toast({
      title: "Länkarna har kopierats!",
      description: `${photoIds.length} fotolänkar kopierades till urklipp`,
    });
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

  const handleEditPhotos = async (photoIds: string[], photoType: 'main' | 'documentation') => {
    // Initialize countdown timers for selected photos
    const newEditingState: Record<string, { timeLeft: number; isEditing: boolean }> = {};
    photoIds.forEach(id => {
      newEditingState[id] = { timeLeft: 240, isEditing: true }; // 4 minutes = 240 seconds
    });
    setEditingPhotos(prev => ({ ...prev, ...newEditingState }));

    // Start countdown for each photo
    photoIds.forEach(photoId => {
      const intervalId = setInterval(() => {
        setEditingPhotos(prev => {
          const current = prev[photoId];
          if (!current || current.timeLeft <= 1) {
            clearInterval(intervalId);
            return prev;
          }
          return {
            ...prev,
            [photoId]: { ...current, timeLeft: current.timeLeft - 1 }
          };
        });
      }, 1000);
    });

    // Process photos with API
    try {
      const photosToProcess = photos.filter(p => photoIds.includes(p.id));
      
      for (const photo of photosToProcess) {
        try {
          // Call edit-photo edge function
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const file = new File([blob], 'photo.jpg', { type: blob.type });
          
          const formData = new FormData();
          formData.append('image_file', file);

          const { data, error } = await supabase.functions.invoke('edit-photo', {
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
          const editedBlob = new Blob([bytes], { type: 'image/png' });

          // Upload edited image
          const editedFileName = `${car.id}/edited-${Date.now()}-${Math.random()}.png`;
          const { error: uploadError } = await supabase.storage
            .from('car-photos')
            .upload(editedFileName, editedBlob, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('car-photos')
            .getPublicUrl(editedFileName);

          // Update photo record
          await supabase
            .from('photos')
            .update({
              url: publicUrl,
              is_edited: true,
            })
            .eq('id', photo.id);

        } catch (error) {
          console.error(`Error editing photo ${photo.id}:`, error);
        }
      }

      toast({
        title: "Bilder redigerade",
        description: `${photosToProcess.length} bilder har redigerats`,
      });
      
      // Clear selection and editing state
      if (photoType === 'main') {
        setSelectedMainPhotos([]);
      } else {
        setSelectedDocPhotos([]);
      }
      
      // Clear editing state after completion
      setEditingPhotos(prev => {
        const newState = { ...prev };
        photoIds.forEach(id => delete newState[id]);
        return newState;
      });
      
      fetchCarData();
    } catch (error: any) {
      toast({
        title: "Fel vid redigering av bilder",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApplyWatermark = async (photoIds: string[], photoType: 'main' | 'documentation') => {
    setApplyingWatermark(true);
    try {
      // Get user's settings
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ingen användare inloggad");

      const { data: settings } = await supabase
        .from("ai_settings")
        .select("logo_url, watermark_x, watermark_y, watermark_size")
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
      const photosToProcess = photos.filter(p => photoIds.includes(p.id));
      
      for (const photo of photosToProcess) {
        try {
          // Apply watermark with user's settings
          const watermarkedBlob = await applyWatermark(
            photo.url, 
            settings.logo_url, 
            settings.watermark_x || 20,
            settings.watermark_y || 20,
            settings.watermark_size || 15
          );
          
          // Upload the watermarked image
          const fileExt = 'png';
          const fileName = `watermarked-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${car.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('car-photos')
            .upload(filePath, watermarkedBlob, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('car-photos')
            .getPublicUrl(filePath);

          // Update photo record
          await supabase
            .from('photos')
            .update({
              url: publicUrl,
              original_url: photo.original_url || photo.url,
              is_edited: true,
            })
            .eq('id', photo.id);

        } catch (error) {
          console.error(`Error processing photo ${photo.id}:`, error);
        }
      }

      toast({
        title: "Vattenmärke tillagt",
        description: `${photosToProcess.length} bilder har uppdaterats`,
      });
      
      // Clear selection and refresh
      if (photoType === 'main') {
        setSelectedMainPhotos([]);
      } else {
        setSelectedDocPhotos([]);
      }
      fetchCarData();
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

  const mainPhotos = photos.filter((p) => p.photo_type === "main");
  const docPhotos = photos.filter((p) => p.photo_type === "documentation");

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="hover:bg-secondary hover:scale-105 hover:-translate-x-1 transition-all duration-300 group animate-fade-in"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Tillbaka till huvudsidan
          </Button>
          <div className="flex gap-2">
            <BlocketSyncButton carId={car.id} car={car} variant="outline" />
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="hover:scale-105 transition-all duration-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Ta bort bil
            </Button>
          </div>
        </div>

        {/* Car Info Card */}
        <Card className="mb-8 bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all duration-500 animate-scale-in">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                {car.year} {car.make} {car.model}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditDialogOpen(true)}
                className="hover:scale-110 transition-transform duration-300"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {car.price && (
                <div>
                  <p className="text-base text-muted-foreground font-medium">Pris</p>
                  <p className="font-semibold">{car.price.toLocaleString()} SEK</p>
                </div>
              )}
              {car.registration_number && (
                <div>
                  <p className="text-base text-muted-foreground font-medium">Registreringsnummer</p>
                  <p>{car.registration_number}</p>
                </div>
              )}
              {car.vin && (
                <div>
                  <p className="text-base text-muted-foreground font-medium">Reg.nr.</p>
                  <p>{car.vin}</p>
                </div>
              )}
              {car.color && (
                <div>
                  <p className="text-base text-muted-foreground font-medium">Färg</p>
                  <p>{car.color}</p>
                </div>
              )}
              {car.mileage && (
                <div>
                  <p className="text-base text-muted-foreground font-medium">Miltal</p>
                  <p>{car.mileage.toLocaleString()} km</p>
                </div>
              )}
              {car.fuel && (
                <div>
                  <p className="text-base text-muted-foreground font-medium">Bränsle</p>
                  <p>{car.fuel}</p>
                </div>
              )}
              {car.gearbox && (
                <div>
                  <p className="text-base text-muted-foreground font-medium">Växellåda</p>
                  <p>{car.gearbox}</p>
                </div>
              )}
              {car.description && (
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-base text-muted-foreground font-medium">Beskrivning</p>
                  <p className="whitespace-pre-wrap">{car.description}</p>
                </div>
              )}
              <div className="md:col-span-2 lg:col-span-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-base text-muted-foreground font-medium">Anteckningar (delat med företaget)</p>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Spara Anteckningar
                  </Button>
                </div>
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Lägg till anteckningar om bilen här..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos Section */}
        <Tabs defaultValue="main" className="space-y-6 animate-fade-in-up">
          <TabsList className="bg-card border border-border shadow-card">
            <TabsTrigger
              value="main"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Huvudfoton ({mainPhotos.length})
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300"
            >
              <FileText className="w-4 h-4 mr-2" />
              Dokumentation ({docPhotos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-6">
            <div className="flex justify-end gap-2">
              {selectedMainPhotos.length > 0 && (
                <>
                  <Button
                    onClick={() => handleEditPhotos(selectedMainPhotos, 'main')}
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Få bilder redigerade ({selectedMainPhotos.length})
                  </Button>
                  <Button
                    onClick={() => handleApplyWatermark(selectedMainPhotos, 'main')}
                    variant="outline"
                    disabled={applyingWatermark}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Stamp className="w-4 h-4 mr-2" />
                    {applyingWatermark ? "Lägger till..." : `Lägg till vattenmärke (${selectedMainPhotos.length})`}
                  </Button>
                  <Button
                    onClick={() => handleSharePhotos(selectedMainPhotos)}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Dela ({selectedMainPhotos.length})
                  </Button>
                </>
              )}
              <Button
                onClick={() => {
                  setUploadType("main");
                  setUploadDialogOpen(true);
                }}
                className="bg-gradient-primary hover:bg-gradient-hover shadow-glow hover:shadow-intense hover:scale-105 transition-all duration-300"
              >
                <Upload className="w-4 h-4 mr-2" />
                Ladda upp huvudfoton
              </Button>
            </div>
            <PhotoGalleryDraggable 
              photos={mainPhotos} 
              onUpdate={fetchCarData}
              selectedPhotos={selectedMainPhotos}
              onSelectionChange={setSelectedMainPhotos}
              editingPhotos={editingPhotos}
            />
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <div className="flex justify-end gap-2">
              {selectedDocPhotos.length > 0 && (
                <>
                  <Button
                    onClick={() => handleApplyWatermark(selectedDocPhotos, 'documentation')}
                    variant="outline"
                    disabled={applyingWatermark}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Stamp className="w-4 h-4 mr-2" />
                    {applyingWatermark ? "Lägger till..." : `Lägg till vattenmärke (${selectedDocPhotos.length})`}
                  </Button>
                  <Button
                    onClick={() => handleSharePhotos(selectedDocPhotos)}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Dela ({selectedDocPhotos.length})
                  </Button>
                </>
              )}
              <Button
                onClick={() => {
                  setUploadType("documentation");
                  setUploadDialogOpen(true);
                }}
                className="bg-gradient-primary hover:bg-gradient-hover shadow-glow hover:shadow-intense hover:scale-105 transition-all duration-300"
              >
                <Upload className="w-4 h-4 mr-2" />
                Ladda upp dokumentation
              </Button>
            </div>
            <PhotoGalleryDraggable 
              photos={docPhotos} 
              onUpdate={fetchCarData}
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
        onUploadComplete={fetchCarData}
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
        <EditCarDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} car={car} onCarUpdated={fetchCarData} />
      )}
    </div>
  );
};

export default CarDetail;
