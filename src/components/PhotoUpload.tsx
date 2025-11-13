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

  const mockEditPhoto = async (file: File): Promise<string> => {
    // Mock API call - in production, this would call your editing API
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return the same file URL for now - in production this would be the edited version
        const url = URL.createObjectURL(file);
        resolve(url);
      }, 1000);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({ title: "Please select files to upload", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        // Upload original to storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${carId}/${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("car-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("car-photos")
          .getPublicUrl(fileName);

        // Mock API call for editing
        const editedUrl = await mockEditPhoto(file);

        // Save to database
        const { error: dbError } = await supabase.from("photos").insert({
          car_id: carId,
          url: editedUrl, // In production, this would be the edited photo URL
          original_url: publicUrl,
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
            Select photos to upload. They will be automatically edited via our API.
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