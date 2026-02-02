import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const ImageLightbox = ({ images, currentIndex, isOpen, onClose, onNavigate }: ImageLightboxProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = images[currentIndex] || "";
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < images.length - 1;

  // Optimize Supabase images for faster loading
  const optimizedUrl = getOptimizedImageUrl(imageUrl, { 
    width: 1920, 
    quality: 85,
    resize: 'contain'
  });

  const goToPrev = useCallback(() => {
    if (canGoPrev) {
      setIsLoading(true);
      onNavigate(currentIndex - 1);
    }
  }, [canGoPrev, currentIndex, onNavigate]);

  const goToNext = useCallback(() => {
    if (canGoNext) {
      setIsLoading(true);
      onNavigate(currentIndex + 1);
    }
  }, [canGoNext, currentIndex, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToPrev, goToNext]);

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
          {/* Top right buttons */}
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

          {/* Left arrow */}
          {canGoPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background h-12 w-12"
              onClick={goToPrev}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {/* Right arrow */}
          {canGoNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background h-12 w-12"
              onClick={goToNext}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}
          
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

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm text-muted-foreground">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
