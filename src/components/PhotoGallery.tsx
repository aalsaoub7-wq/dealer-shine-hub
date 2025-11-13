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
      toast({ title: "Photo deleted" });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error deleting photo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (photos.length === 0) {
    return (
      <Card className="bg-gradient-card border-border/50 p-12 text-center">
        <p className="text-muted-foreground">No photos uploaded yet</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {photos.map((photo) => (
        <Card
          key={photo.id}
          className="bg-gradient-card border-border/50 overflow-hidden group shadow-card hover:shadow-glow transition-all"
        >
          <div className="relative aspect-video bg-secondary">
            <img
              src={photo.url}
              alt="Car photo"
              className="w-full h-full object-cover"
            />
            {photo.is_edited && (
              <Badge className="absolute top-2 left-2 bg-gradient-primary">
                <Check className="w-3 h-3 mr-1" />
                Edited
              </Badge>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="destructive"
                onClick={() => handleDelete(photo.id)}
                className="h-8 w-8"
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