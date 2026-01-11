import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import customExample1 from "@/assets/custom-studio-example-1.jpg";
import customExample2 from "@/assets/custom-studio-example-2.png";

interface CustomStudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomStudioDialog = ({ open, onOpenChange }: CustomStudioDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Custom Studio</DialogTitle>
        </DialogHeader>
        
        <p className="text-muted-foreground">
          Få en skräddarsydd studiobakgrund med din logotyp integrerad.
        </p>
        
        {/* Exempelbilder */}
        <div className="flex flex-col gap-3 my-4">
          <div className="aspect-video rounded-lg overflow-hidden">
            <img 
              src={customExample1} 
              alt="" 
              className="w-full h-full object-cover" 
              loading="eager"
              decoding="async"
            />
          </div>
          <div className="aspect-video rounded-lg overflow-hidden">
            <img 
              src={customExample2} 
              alt="" 
              className="w-full h-full object-cover" 
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
        
        {/* Pris */}
        <div className="text-center py-3 bg-muted/50 rounded-lg mb-4">
          <span className="text-lg font-semibold">Från 299 kr</span>
        </div>
        
        {/* CTA */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => window.location.href = "tel:0793436810"}
        >
          <Phone className="h-4 w-4 mr-2" />
          Ring 0793436810
        </Button>
      </DialogContent>
    </Dialog>
  );
};
