import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, Image as ImageIcon, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGallery from "@/components/PhotoGallery";

interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  notes: string | null;
}

interface Photo {
  id: string;
  url: string;
  photo_type: "main" | "documentation";
  is_edited: boolean;
  original_url: string | null;
}

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState<CarData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"main" | "documentation">("main");
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
      const { data: carData, error: carError } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();

      if (carError) throw carError;
      setCar(carData);

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from("photos")
        .select("*")
        .eq("car_id", id)
        .order("created_at", { ascending: false });

      if (photosError) throw photosError;
      setPhotos((photosData || []) as Photo[]);
    } catch (error: any) {
      toast({
        title: "Error loading car data",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const mainPhotos = photos.filter((p) => p.photo_type === "main");
  const docPhotos = photos.filter((p) => p.photo_type === "documentation");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Car Info Card */}
        <Card className="mb-8 bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl">
              {car.year} {car.make} {car.model}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {car.vin && (
                <div>
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-mono text-sm">{car.vin}</p>
                </div>
              )}
              {car.color && (
                <div>
                  <p className="text-sm text-muted-foreground">Color</p>
                  <p>{car.color}</p>
                </div>
              )}
              {car.mileage && (
                <div>
                  <p className="text-sm text-muted-foreground">Mileage</p>
                  <p>{car.mileage.toLocaleString()} miles</p>
                </div>
              )}
              {car.notes && (
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{car.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photos Section */}
        <Tabs defaultValue="main" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="main" className="data-[state=active]:bg-gradient-primary">
              <ImageIcon className="w-4 h-4 mr-2" />
              Main Photos ({mainPhotos.length})
            </TabsTrigger>
            <TabsTrigger value="docs" className="data-[state=active]:bg-gradient-primary">
              <FileText className="w-4 h-4 mr-2" />
              Documentation ({docPhotos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setUploadType("main");
                  setUploadDialogOpen(true);
                }}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Main Photos
              </Button>
            </div>
            <PhotoGallery photos={mainPhotos} onUpdate={fetchCarData} />
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setUploadType("documentation");
                  setUploadDialogOpen(true);
                }}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Documentation
              </Button>
            </div>
            <PhotoGallery photos={docPhotos} onUpdate={fetchCarData} />
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
    </div>
  );
};

export default CarDetail;