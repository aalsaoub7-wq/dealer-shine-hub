import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Phone, Unlock } from "lucide-react";
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

  const handleSubmitCode = () => {
    if (code.trim() && onCodeSubmit) {
      onCodeSubmit(code.trim());
      setCode("");
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Studio</DialogTitle>
        </DialogHeader>
        
        <p className="text-muted-foreground">
          Få en skräddarsydd studiobakgrund med din logotyp integrerad.
        </p>
        
        {/* Exempelbilder */}
        <div className="flex flex-col gap-3 my-4">
          <div className="aspect-video rounded-lg overflow-hidden">
            <img src={customExample1} alt="" className="w-full h-full object-cover" loading="eager" decoding="async" />
          </div>
          <div className="aspect-video rounded-lg overflow-hidden">
            <img src={customExample2} alt="" className="w-full h-full object-cover" loading="eager" decoding="async" />
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
    </Dialog>;
};