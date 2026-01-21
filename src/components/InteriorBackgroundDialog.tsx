import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Palette, Image as ImageIcon, Check } from "lucide-react";

interface InteriorBackgroundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSolidColorSelected: () => void;
  onImageSelected: (imageUrl: string) => void;
  availableBackgrounds: string[];
  isProcessing?: boolean;
}

export function InteriorBackgroundDialog({
  open,
  onOpenChange,
  onSolidColorSelected,
  onImageSelected,
  availableBackgrounds,
  isProcessing = false,
}: InteriorBackgroundDialogProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSolidColor = () => {
    onSolidColorSelected();
    onOpenChange(false);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirmImage = () => {
    if (selectedImage) {
      onImageSelected(selectedImage);
      onOpenChange(false);
      setSelectedImage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>Välj bakgrundstyp</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Option 1: Solid Color */}
          <Button
            variant="outline"
            className="w-full justify-start items-start gap-3 h-auto py-4 px-4 whitespace-normal"
            onClick={handleSolidColor}
            disabled={isProcessing}
          >
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="font-medium break-words">Solid färg</div>
              <div className="text-sm text-muted-foreground break-words">
                Välj en enfärgad bakgrund för bilden
              </div>
            </div>
          </Button>

          {/* Option 2: Background Image */}
          {availableBackgrounds.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ImageIcon className="w-4 h-4" />
                Bakgrundsbild
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availableBackgrounds.map((bgUrl, index) => (
                  <button
                    key={`${bgUrl}-${index}`}
                    onClick={() => handleImageClick(bgUrl)}
                    disabled={isProcessing}
                    className={`relative aspect-[3/2] rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                      selectedImage === bgUrl
                        ? "border-primary ring-2 ring-primary/50"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={bgUrl}
                      alt={`Bakgrund ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedImage === bgUrl && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="p-1.5 rounded-full bg-primary">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedImage && (
                <Button
                  onClick={handleConfirmImage}
                  disabled={isProcessing}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Använd vald bakgrund
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
