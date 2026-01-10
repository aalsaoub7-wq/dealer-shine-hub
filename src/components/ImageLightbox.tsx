import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2 } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

interface ImageLightboxProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageLightbox = ({ imageUrl, isOpen, onClose }: ImageLightboxProps) => {
  const [isLoading, setIsLoading] = useState(true);

  // Optimize Supabase images for faster loading
  const optimizedUrl = getOptimizedImageUrl(imageUrl, { 
    width: 1920, 
    quality: 85,
    resize: 'contain'
  });

  const handleDownload = async () => {
    try {
      // Download original quality image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Fel vid nedladdning:', error);
    }
  };

  // Reset loading state when dialog opens with new image
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
    setIsLoading(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 backdrop-blur">
        <div className="relative w-full h-full flex items-center justify-center min-h-[50vh]">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-background/80 hover:bg-background"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-16 z-10 bg-background/80 hover:bg-background"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5" />
          </Button>
          
          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          
          <img
            src={optimizedUrl}
            alt="Förstorad bild"
            className={`max-w-full max-h-[90vh] object-contain transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
