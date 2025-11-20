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
import { addCarSchema, type AddCarFormData } from "@/lib/validation";
import { Input } from "@/components/ui/input";

interface AddCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCarAdded: () => void;
}

const AddCarDialog = ({ open, onOpenChange, onCarAdded }: AddCarDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [carName, setCarName] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof AddCarFormData, string>>>({});
  const { toast } = useToast();

  const handleDialogChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setRegistrationNumber("");
      setCarName("");
      setErrors({});
    }
  };

  const handleCreate = async () => {
    // Validate input
    const validation = addCarSchema.safeParse({
      name: carName,
      registration_number: registrationNumber,
    });

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof AddCarFormData, string>> = {};
      validation.error.errors.forEach((error) => {
        const field = error.path[0] as keyof AddCarFormData;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      toast({
        title: "Valideringsfel",
        description: "Vänligen kontrollera alla fält",
        variant: "destructive",
      });
      return;
    }

    setErrors({});
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
            <Label htmlFor="name">Namn *</Label>
            <Input
              id="name"
              type="text"
              value={carName}
              onChange={(e) => {
                setCarName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="T.ex. Volvo V70"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration">Registreringsnummer *</Label>
            <LicensePlateInput
              value={registrationNumber}
              onChange={(value) => {
                setRegistrationNumber(value);
                setErrors((prev) => ({ ...prev, registration_number: undefined }));
              }}
            />
            {errors.registration_number && (
              <p className="text-sm text-destructive">{errors.registration_number}</p>
            )}
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
