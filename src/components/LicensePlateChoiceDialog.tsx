import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Registreringsskylt</AlertDialogTitle>
          <AlertDialogDescription>
            Vill du behålla eller ta bort texten på registreringsskylten?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onChoice(false)}
            className="w-full sm:w-auto"
          >
            Behåll reg skylt
          </Button>
          <Button
            onClick={() => onChoice(true)}
            className="w-full sm:w-auto"
          >
            Ta bort reg skylt
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
