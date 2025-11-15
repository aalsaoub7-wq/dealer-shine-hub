import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Masonry from "react-masonry-css";

interface Photo {
  id: string;
  url: string;
}

interface SharedCollection {
  title: string | null;
  landing_page_logo_url: string | null;
  landing_page_background_color: string;
  landing_page_layout: 'grid' | 'carousel' | 'masonry';
  landing_page_header_image_url: string | null;
  landing_page_text_color: string;
  landing_page_accent_color: string;
  landing_page_title: string;
  landing_page_description: string | null;
  landing_page_footer_text: string | null;
  landing_page_logo_size: 'small' | 'medium' | 'large';
  landing_page_logo_position: 'left' | 'center' | 'right';
  landing_page_header_height: 'small' | 'medium' | 'large';
  landing_page_header_fit: 'cover' | 'contain' | 'fill';
  photos: Photo[];
}

const SharedPhotos = () => {
  const { token } = useParams();
  const [collection, setCollection] = useState<SharedCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      loadSharedCollection();
    }
  }, [token]);

  const loadSharedCollection = async () => {
    try {
      // Get shared collection
      const { data: collectionData, error: collectionError } = await supabase
        .from("shared_collections")
        .select("title, photo_ids, user_id")
        .eq("share_token", token)
        .single();

      if (collectionError) throw collectionError;

      // Get user's AI settings for landing page design
      const { data: settings } = await supabase
        .from("ai_settings")
        .select("landing_page_logo_url, landing_page_background_color, landing_page_layout, landing_page_header_image_url, landing_page_text_color, landing_page_accent_color, landing_page_title, landing_page_description, landing_page_footer_text, landing_page_logo_size, landing_page_logo_position, landing_page_header_height, landing_page_header_fit")
        .eq("user_id", collectionData.user_id)
        .single();

      // Get photos
      const { data: photos, error: photosError } = await supabase
        .from("photos")
        .select("id, url")
        .in("id", collectionData.photo_ids);

      if (photosError) throw photosError;

      setCollection({
        title: collectionData.title,
        landing_page_logo_url: settings?.landing_page_logo_url || null,
        landing_page_background_color: settings?.landing_page_background_color || "#ffffff",
        landing_page_layout: (settings?.landing_page_layout as 'grid' | 'carousel' | 'masonry') || "grid",
        landing_page_header_image_url: settings?.landing_page_header_image_url || null,
        landing_page_text_color: settings?.landing_page_text_color || "#000000",
        landing_page_accent_color: settings?.landing_page_accent_color || "#000000",
        landing_page_title: settings?.landing_page_title || "Mina Bilder",
        landing_page_description: settings?.landing_page_description || null,
        landing_page_footer_text: settings?.landing_page_footer_text || null,
        landing_page_logo_size: (settings?.landing_page_logo_size as 'small' | 'medium' | 'large') || 'medium',
        landing_page_logo_position: (settings?.landing_page_logo_position as 'left' | 'center' | 'right') || 'center',
        landing_page_header_height: (settings?.landing_page_header_height as 'small' | 'medium' | 'large') || 'medium',
        landing_page_header_fit: (settings?.landing_page_header_fit as 'cover' | 'contain' | 'fill') || 'cover',
        photos: photos || [],
      });
    } catch (error: any) {
      console.error("Error loading shared collection:", error);
      toast({
        title: "Kunde inte ladda samlingen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `photo-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Fel vid nedladdning",
        description: "Kunde inte ladda ner bilden",
        variant: "destructive",
      });
    }
  };

  const nextImage = () => {
    if (collection) {
      setCurrentImageIndex((prev) => (prev + 1) % collection.photos.length);
    }
  };

  const prevImage = () => {
    if (collection) {
      setCurrentImageIndex((prev) => (prev - 1 + collection.photos.length) % collection.photos.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Samlingen kunde inte hittas</p>
      </div>
    );
  }

  const backgroundColor = collection.landing_page_background_color;

  const logoSizeClass = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-16'
  }[collection.landing_page_logo_size];

  const headerHeightClass = {
    small: 'h-16',
    medium: 'h-24',
    large: 'h-32'
  }[collection.landing_page_header_height];

  const headerFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill'
  }[collection.landing_page_header_fit];

  const logoAlignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }[collection.landing_page_logo_position];

  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[collection.landing_page_logo_position];

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor }}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 space-y-4">
        {collection.landing_page_logo_url && (
          <div className={`flex ${logoAlignClass}`}>
            <img
              src={collection.landing_page_logo_url}
              alt="Logo"
              className={`${logoSizeClass} object-contain`}
            />
          </div>
        )}
        
        {collection.landing_page_header_image_url && (
          <img
            src={collection.landing_page_header_image_url}
            alt="Header"
            className={`w-full ${headerHeightClass} ${headerFitClass} rounded`}
          />
        )}
        
        <h1 
          className={`text-xl font-bold ${textAlignClass}`}
          style={{ color: collection.landing_page_text_color }}
        >
          {collection.landing_page_title}
        </h1>
        
        {collection.landing_page_description && (
          <p 
            className={`text-sm ${textAlignClass}`}
            style={{ color: collection.landing_page_text_color, opacity: 0.8 }}
          >
            {collection.landing_page_description}
          </p>
        )}
      </div>

      {/* Photos */}
      <div className="max-w-7xl mx-auto">
        {collection.landing_page_layout === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative aspect-video bg-secondary rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={photo.url}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleDownload(photo.url, index)}
                  className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ 
                    backgroundColor: collection.landing_page_accent_color,
                    color: '#ffffff'
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {collection.landing_page_layout === 'carousel' && (
          <div className="relative max-w-4xl mx-auto">
            <div className="aspect-video bg-secondary rounded-lg overflow-hidden shadow-lg">
              <img
                src={collection.photos[currentImageIndex]?.url}
                alt={`Foto ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button
                onClick={prevImage}
                variant="outline"
                size="icon"
                disabled={collection.photos.length <= 1}
                style={{
                  borderColor: collection.landing_page_accent_color,
                  color: collection.landing_page_text_color
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <p 
                className="text-lg"
                style={{ color: collection.landing_page_text_color }}
              >
                {currentImageIndex + 1} / {collection.photos.length}
              </p>
              <Button
                onClick={() => handleDownload(collection.photos[currentImageIndex]?.url, currentImageIndex)}
                style={{ 
                  backgroundColor: collection.landing_page_accent_color,
                  color: '#ffffff'
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Ladda ner
              </Button>
              <Button
                onClick={nextImage}
                variant="outline"
                size="icon"
                disabled={collection.photos.length <= 1}
                style={{
                  borderColor: collection.landing_page_accent_color,
                  color: collection.landing_page_text_color
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {collection.landing_page_layout === 'masonry' && (
          <Masonry
            breakpointCols={{
              default: 3,
              1024: 2,
              640: 1,
            }}
            className="flex -ml-6 w-auto"
            columnClassName="pl-6 bg-clip-padding"
          >
            {collection.photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative mb-6 bg-secondary rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={photo.url}
                  alt={`Foto ${index + 1}`}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleDownload(photo.url, index)}
                  className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ 
                    backgroundColor: collection.landing_page_accent_color,
                    color: '#ffffff'
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </Masonry>
        )}

        {/* Footer */}
        {collection.landing_page_footer_text && (
          <div className="text-center pt-8">
            <p 
              className="text-xs"
              style={{ color: collection.landing_page_text_color, opacity: 0.6 }}
            >
              {collection.landing_page_footer_text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedPhotos;
