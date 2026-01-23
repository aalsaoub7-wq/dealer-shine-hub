import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Phone, Unlock, Loader2 } from "lucide-react";

// Use local assets (reliable, bundled with app)
import customExample1 from "@/assets/custom-studio-example-1.jpg";
import customExample2 from "@/assets/custom-studio-example-2.png";

interface CustomStudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCodeSubmit?: (code: string) => void;
}

export const CustomStudioDialog = ({
  open,
  onOpenChange,
  onCodeSubmit
}: CustomStudioDialogProps) => {
  const [code, setCode] = useState("");
  const [image1Loaded, setImage1Loaded] = useState(false);
  const [image2Loaded, setImage2Loaded] = useState(false);

  const handleSubmitCode = () => {
    if (code.trim() && onCodeSubmit) {
      onCodeSubmit(code.trim());
      setCode("");
    }
  };

  // Reset loading states when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setImage1Loaded(false);
      setImage2Loaded(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Studio</DialogTitle>
        </DialogHeader>
        
        <p className="text-muted-foreground">
          Få en skräddarsydd studiobakgrund med din logotyp integrerad.
        </p>
        
        {/* Exempelbilder med smooth loading */}
        <div className="flex flex-col gap-3 my-4">
          <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
            {!image1Loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <img 
              src={customExample1} 
              alt="Custom studio exempel 1" 
              className={`w-full h-full object-cover transition-opacity duration-300 ${image1Loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImage1Loaded(true)}
              onError={() => setImage1Loaded(true)}
            />
          </div>
          <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
            {!image2Loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <img 
              src={customExample2} 
              alt="Custom studio exempel 2" 
              className={`w-full h-full object-cover transition-opacity duration-300 ${image2Loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImage2Loaded(true)}
              onError={() => setImage2Loaded(true)}
            />
          </div>
        </div>
        
        {/* CTA */}
        <Button className="w-full" size="lg" onClick={() => window.location.href = "tel:0793436810"}>
          <Phone className="h-4 w-4 mr-2" />
          Ring 079-343 68 10
        </Button>

        {/* Unlock code section */}
        <Separator className="my-4" />
        <div className="space-y-2">
          <Label htmlFor="unlock-code">Har du en upplåsningskod?</Label>
          <div className="flex gap-2">
            <Input
              id="unlock-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ange kod"
              onKeyDown={(e) => e.key === "Enter" && handleSubmitCode()}
            />
            <Button onClick={handleSubmitCode} disabled={!code.trim()}>
              <Unlock className="h-4 w-4 mr-2" />
              Lås upp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};