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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vattenmärkesalternativ</DialogTitle>
          <DialogDescription>
            Välj vad du vill göra med vattenmärket på denna bild.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="outline"
            className="w-full justify-start items-start gap-3 h-auto py-4 px-4 whitespace-normal"
            onClick={() => {
              onRemoveWatermark();
              onOpenChange(false);
            }}
          >
            <Trash2 className="w-5 h-5 text-destructive shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <div className="font-medium break-words">Ta bort vattenmärket</div>
              <div className="text-sm text-muted-foreground break-words">
                Återställ bilden till innan vattenmärket applicerades
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start items-start gap-3 h-auto py-4 px-4 whitespace-normal"
            onClick={() => {
              onAdjustPosition();
              onOpenChange(false);
            }}
          >
            <Move className="w-5 h-5 text-primary shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <div className="font-medium break-words">Justera vattenmärkets position</div>
              <div className="text-sm text-muted-foreground break-words">
                Flytta eller ändra storlek på vattenmärket
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
