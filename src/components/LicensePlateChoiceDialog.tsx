import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldOff } from "lucide-react";

interface LicensePlateChoiceDialogProps {
  open: boolean;
  onChoice: (removePlate: boolean) => void;
  onCancel: () => void;
}

export const LicensePlateChoiceDialog = ({
  open,
  onChoice,
  onCancel,
}: LicensePlateChoiceDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registreringsskylt</DialogTitle>
          <DialogDescription>
            Vill du behålla eller ta bort texten på registreringsskylten?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button
            variant="outline"
            className="w-full justify-start items-start gap-3 h-auto py-4 px-4 whitespace-normal"
            onClick={() => onChoice(false)}
          >
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="font-medium break-words">Behåll reg skylt</div>
              <div className="text-sm text-muted-foreground break-words">
                Registreringsskylten lämnas orörd
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start items-start gap-3 h-auto py-4 px-4 whitespace-normal"
            onClick={() => onChoice(true)}
          >
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <ShieldOff className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="font-medium break-words">Ta bort reg skylt</div>
              <div className="text-sm text-muted-foreground break-words">
                Texten på skylten suddas ut av AI
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
