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
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
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
      toast({ title: "Please select files to upload", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        // Edit photo through API
        const editedBlob = await editPhotoWithAPI(file);

        // Upload edited photo to storage
        const fileExt = file.name.split(".").pop();
        const editedFileName = `${carId}/edited-${Date.now()}-${Math.random()}.png`;
        const { error: editedUploadError } = await supabase.storage
          .from("car-photos")
          .upload(editedFileName, editedBlob, { contentType: 'image/png' });

        if (editedUploadError) throw editedUploadError;

        const { data: { publicUrl: editedUrl } } = supabase.storage
          .from("car-photos")
          .getPublicUrl(editedFileName);

        // Verify accessibility; fallback to signed URL if needed
        let finalEditedUrl = editedUrl;
        try {
          const head = await fetch(editedUrl, { method: 'HEAD' });
          if (!head.ok) {
            const { data: signedEdited } = await supabase.storage
              .from('car-photos')
              .createSignedUrl(editedFileName, 60 * 60 * 24 * 365);
            if (signedEdited?.signedUrl) finalEditedUrl = signedEdited.signedUrl;
          }
        } catch {}

        // Upload original to storage
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
          const head2 = await fetch(originalUrl, { method: 'HEAD' });
          if (!head2.ok) {
            const { data: signedOriginal } = await supabase.storage
              .from('car-photos')
              .createSignedUrl(originalFileName, 60 * 60 * 24 * 365);
            if (signedOriginal?.signedUrl) finalOriginalUrl = signedOriginal.signedUrl;
          }
        } catch {}

        // Save to database
        const { error: dbError } = await supabase.from("photos").insert({
          car_id: carId,
          url: finalEditedUrl,
          original_url: finalOriginalUrl,
          photo_type: photoType,
          is_edited: true,
        });

        if (dbError) throw dbError;
      }

      toast({ title: "Photos uploaded and edited successfully!" });
      onUploadComplete();
      onOpenChange(false);
      setSelectedFiles([]);
    } catch (error: any) {
      toast({
        title: "Error uploading photos",
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
            Upload {photoType === "main" ? "Main Photos" : "Documentation"}
          </DialogTitle>
          <DialogDescription>
            Select photos to upload. They will be automatically edited via PhotoRoom API.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-primary hover:text-primary/80 transition-colors"
            >
              Click to select photos
            </label>
            {selectedFiles.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedFiles.length} file(s) selected
              </p>
            )}
          </div>
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
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="bg-gradient-primary hover:opacity-90"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upload & Edit"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoUpload;