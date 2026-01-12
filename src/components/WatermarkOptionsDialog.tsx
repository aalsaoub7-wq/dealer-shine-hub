import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Move } from "lucide-react";

interface WatermarkOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveWatermark: () => void;
  onAdjustPosition: () => void;
}

export const WatermarkOptionsDialog = ({
  open,
  onOpenChange,
  onRemoveWatermark,
  onAdjustPosition,
}: WatermarkOptionsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Vattenmärkesalternativ</DialogTitle>
          <DialogDescription>
            Välj vad du vill göra med vattenmärket på denna bild.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14"
            onClick={() => {
              onRemoveWatermark();
              onOpenChange(false);
            }}
          >
            <Trash2 className="w-5 h-5 text-destructive" />
            <div className="text-left">
              <div className="font-medium">Ta bort vattenmärket</div>
              <div className="text-sm text-muted-foreground">
                Återställ bilden till innan vattenmärket applicerades
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14"
            onClick={() => {
              onAdjustPosition();
              onOpenChange(false);
            }}
          >
            <Move className="w-5 h-5 text-primary" />
            <div className="text-left">
              <div className="font-medium">Justera vattenmärkets position</div>
              <div className="text-sm text-muted-foreground">
                Flytta eller ändra storlek på vattenmärket
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
