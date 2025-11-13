import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Photo {
  id: string;
  url: string;
  is_edited: boolean;
  original_url: string | null;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onUpdate: () => void;
}

const PhotoGallery = ({ photos, onUpdate }: PhotoGalleryProps) => {
  const { toast } = useToast();

  const handleDelete = async (photoId: string) => {
    try {
      const { error } = await supabase.from("photos").delete().eq("id", photoId);
      if (error) throw error;
      toast({ title: "Foto raderat" });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Fel vid radering av foto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (photos.length === 0) {
    return (
      <Card className="bg-gradient-card border-border/50 p-12 text-center animate-fade-in">
        <p className="text-muted-foreground">Inga foton uppladdade än</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {photos.map((photo, index) => (
        <Card
          key={photo.id}
          className="bg-gradient-card border-border/50 overflow-hidden group shadow-card hover:shadow-intense hover:-translate-y-2 transition-all duration-500 animate-fade-in-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="relative aspect-video bg-secondary">
            <img
              src={photo.url}
              alt="Bilfoto"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                // Try original_url fallback first
                if (photo.original_url && el.src !== photo.original_url) {
                  el.src = photo.original_url;
                  return;
                }
                // Try swapping extension between png/webp as a last resort
                if (el.src.endsWith('.png')) el.src = el.src.replace('.png', '.webp');
                else if (el.src.endsWith('.webp')) el.src = el.src.replace('.webp', '.png');
              }}
            />
            <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            {photo.is_edited && (
              <Badge className="absolute top-2 left-2 bg-gradient-primary shadow-glow animate-scale-in">
                <Check className="w-3 h-3 mr-1" />
                Redigerad
              </Badge>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Button
                size="icon"
                variant="destructive"
                onClick={() => handleDelete(photo.id)}
                className="h-8 w-8 hover:scale-110 transition-transform duration-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PhotoGallery;