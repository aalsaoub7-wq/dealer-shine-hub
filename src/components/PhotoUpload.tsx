import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Camera, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validateImageFile } from "@/lib/validation";
import { useNativeCamera } from "@/hooks/useNativeCamera";
import { useHaptics } from "@/hooks/useHaptics";
import { isNativeApp } from "@/lib/utils";

interface PhotoUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  photoType: "main" | "documentation";
  onUploadComplete: () => void;
}

const PhotoUpload = ({
  open,
  onOpenChange,
  carId,
  photoType,
  onUploadComplete,
}: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const { takePhoto, pickFromGallery, pickMultipleFromGallery, isCapturing } = useNativeCamera({
    onPhotoCaptured: (file) => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        setSelectedFiles((prev) => [...prev, file]);
      } else {
        toast({
          title: "Ogiltig fil",
          description: validation.error,
          variant: "destructive",
        });
      }
    },
  });
  const { lightImpact } = useHaptics();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validate each file
      const invalidFiles: string[] = [];
      const validFiles: File[] = [];

      files.forEach((file) => {
        const validation = validateImageFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          invalidFiles.push(`${file.name}: ${validation.error}`);
        }
      });

      if (invalidFiles.length > 0) {
        toast({
          title: "Vissa filer kunde inte laddas upp",
          description: invalidFiles.join("\n"),
          variant: "destructive",
        });
      }

      setSelectedFiles(validFiles);
    }
  };

  const editPhotoWithAPI = async (file: File): Promise<Blob> => {
    const formData = new FormData();
    formData.append('image_file', file);

    const { data, error } = await supabase.functions.invoke('edit-photo', {
      body: formData,
    });

    if (error) throw error;
    
    // Convert base64 response to blob
    const base64 = data.image;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/png' });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({ title: "Vänligen välj filer att ladda upp", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split(".").pop();
        
        // For documentation photos, only upload original (no API editing)
        if (photoType === "documentation") {
          const originalFileName = `${carId}/doc-${Date.now()}-${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("car-photos")
            .upload(originalFileName, file, { contentType: file.type || 'application/octet-stream' });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("car-photos")
            .getPublicUrl(originalFileName);

          let finalUrl = publicUrl;
          try {
            const head = await fetch(publicUrl, { method: 'HEAD' });
            if (!head.ok) {
              const { data: signed } = await supabase.storage
                .from('car-photos')
                .createSignedUrl(originalFileName, 60 * 60 * 24 * 365);
              if (signed?.signedUrl) finalUrl = signed.signedUrl;
            }
          } catch {}

          const { error: dbError } = await supabase.from("photos").insert({
            car_id: carId,
            url: finalUrl,
            original_url: finalUrl,
            photo_type: photoType,
            is_edited: false,
          });

          if (dbError) throw dbError;
        } else {
          // For main photos, just upload original (no auto-editing)
          const originalFileName = `${carId}/original-${Date.now()}-${Math.random()}.${fileExt}`;
          const { error: originalUploadError } = await supabase.storage
            .from("car-photos")
            .upload(originalFileName, file, { contentType: file.type || 'application/octet-stream' });

          if (originalUploadError) throw originalUploadError;

          const { data: { publicUrl: originalUrl } } = supabase.storage
            .from("car-photos")
            .getPublicUrl(originalFileName);

          let finalOriginalUrl = originalUrl;
          try {
            const head = await fetch(originalUrl, { method: 'HEAD' });
            if (!head.ok) {
              const { data: signed } = await supabase.storage
                .from('car-photos')
                .createSignedUrl(originalFileName, 60 * 60 * 24 * 365);
              if (signed?.signedUrl) finalOriginalUrl = signed.signedUrl;
            }
          } catch {}

          const { error: dbError } = await supabase.from("photos").insert({
            car_id: carId,
            url: finalOriginalUrl,
            original_url: finalOriginalUrl,
            photo_type: photoType,
            is_edited: false,
          });

          if (dbError) throw dbError;
        }
      }

      toast({ title: "Foton uppladdade!" });
      onUploadComplete();
      onOpenChange(false);
      setSelectedFiles([]);
    } catch (error: any) {
      toast({
        title: "Fel vid uppladdning av foton",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>
            Ladda upp {photoType === "main" ? "huvudfoton" : "dokumentation"}
          </DialogTitle>
          <DialogDescription>
            Välj foton att ladda upp. De kommer att behandlas automatiskt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isNativeApp() ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={async () => {
                    lightImpact();
                    await takePhoto();
                  }}
                  disabled={isCapturing || uploading}
                  variant="outline"
                  className="h-24 flex-col border-border"
                >
                  <Camera className="w-8 h-8 mb-2" />
                  <span>Ta foto</span>
                </Button>
                <Button
                  onClick={async () => {
                    lightImpact();
                    await pickMultipleFromGallery();
                  }}
                  disabled={isCapturing || uploading}
                  variant="outline"
                  className="h-24 flex-col border-border"
                >
                  <Image className="w-8 h-8 mb-2" />
                  <span>Välj från galleri</span>
                </Button>
              </div>
              {selectedFiles.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  {selectedFiles.length} {selectedFiles.length === 1 ? "fil vald" : "filer valda"}
                </p>
              )}
            </>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-primary hover:text-primary/80 transition-colors"
              >
                Välj filer (max 10MB per fil)
              </label>
              {selectedFiles.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedFiles.length} {selectedFiles.length === 1 ? "fil vald" : "filer valda"}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedFiles([]);
              }}
              disabled={uploading}
              className="border-border"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="bg-gradient-primary hover:opacity-90"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bearbetar...
                </>
              ) : (
                "Ladda upp"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoUpload;