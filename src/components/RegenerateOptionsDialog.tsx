import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Move, Palette } from "lucide-react";

interface RegenerateOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editType?: string | null;
  onRegenerateReflection: () => void;
  onAdjustPosition: () => void;
  onChangeInteriorColor?: () => void;
}

export const RegenerateOptionsDialog = ({
  open,
  onOpenChange,
  editType,
  onRegenerateReflection,
  onAdjustPosition,
  onChangeInteriorColor,
}: RegenerateOptionsDialogProps) => {
  const isInterior = editType === 'interior';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vad vill du göra?</DialogTitle>
          <DialogDescription>
            Välj hur du vill redigera bilden
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          {isInterior ? (
            <>
              <Button
                variant="outline"
                className="w-full justify-start items-start gap-3 h-auto py-4 px-4 whitespace-normal"
                onClick={() => {
                  onChangeInteriorColor?.();
                  onOpenChange(false);
                }}
              >
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium break-words">Ändra bakgrundsfärg</div>
                  <div className="text-sm text-muted-foreground break-words">
                    Välj en ny solid bakgrundsfärg för bilden
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
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Move className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium break-words">Justera position</div>
                  <div className="text-sm text-muted-foreground break-words">
                    Flytta och ändra storlek på bilen och bakgrunden
                  </div>
                </div>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full justify-start items-start gap-3 h-auto py-4 px-4 whitespace-normal"
                onClick={() => {
                  onRegenerateReflection();
                  onOpenChange(false);
                }}
              >
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium break-words">Generera ny skugga och reflektion</div>
                  <div className="text-sm text-muted-foreground break-words">
                    Skicka bilden genom AI igen för en ny reflektion
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
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Move className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium break-words">Justera position</div>
                  <div className="text-sm text-muted-foreground break-words">
                    Flytta och ändra storlek på bilen och bakgrunden
                  </div>
                </div>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
