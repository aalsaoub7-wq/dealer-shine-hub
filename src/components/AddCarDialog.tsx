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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { trackUsage } from "@/lib/usageTracking";
import LicensePlateInput from "./LicensePlateInput";

interface AddCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCarAdded: () => void;
}

const AddCarDialog = ({ open, onOpenChange, onCarAdded }: AddCarDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [carName, setCarName] = useState("");
  const { toast } = useToast();

  const handleDialogChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setRegistrationNumber("");
      setCarName("");
    }
  };

  const handleCreate = async () => {
    if (!registrationNumber.trim() || !carName.trim()) {
      toast({
        title: "Fel",
        description: "Vänligen ange både registreringsnummer och namn",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get user's company
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Användare ej inloggad");

      const { data: userCompany, error: companyError } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (companyError) throw companyError;

      // Insert car with registration number and name
      const { error: insertError } = await supabase.from("cars").insert({
        make: carName,
        model: "",
        year: new Date().getFullYear(),
        registration_number: registrationNumber,
        company_id: userCompany.company_id,
      });

      if (insertError) throw insertError;

      toast({ title: "Bil skapad!" });
      onCarAdded();
      handleDialogChange(false);
    } catch (error: any) {
      toast({
        title: "Fel vid skapande av bil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-card border-border/50 shadow-elegant">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Lägg till ny bil
          </DialogTitle>
          <DialogDescription>
            Ange registreringsnummer för att automatiskt hämta biluppgifter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Namn</Label>
            <input
              id="name"
              type="text"
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="T.ex. Volvo V70"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration">Registreringsnummer</Label>
            <LicensePlateInput
              value={registrationNumber}
              onChange={setRegistrationNumber}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={handleCreate} disabled={loading} className="w-full">
              {loading ? "Skapar..." : "Skapa Bil"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCarDialog;
