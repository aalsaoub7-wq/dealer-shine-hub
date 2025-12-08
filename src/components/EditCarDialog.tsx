import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { editCarSchema, type EditCarFormData } from "@/lib/validation";
interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  price: number | null;
  registration_number: string | null;
  fuel: string | null;
  gearbox: string | null;
  description: string | null;
  notes: string | null;
}
interface EditCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: CarData;
  onCarUpdated: () => void;
}
const EditCarDialog = ({
  open,
  onOpenChange,
  car,
  onCarUpdated
}: EditCarDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    registration_number: "",
    description: "",
    notes: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EditCarFormData, string>>>({});
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (car) {
      setFormData({
        name: car.make || "",
        registration_number: car.registration_number || "",
        description: car.description || "",
        notes: car.notes || ""
      });
    }
  }, [car]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = editCarSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof EditCarFormData, string>> = {};
      validation.error.errors.forEach(error => {
        const field = error.path[0] as keyof EditCarFormData;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      toast({
        title: "Valideringsfel",
        description: "Vänligen kontrollera alla fält",
        variant: "destructive"
      });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from("cars").update({
        make: formData.name || null,
        registration_number: formData.registration_number || null,
        description: formData.description || null,
        notes: formData.notes || null
      }).eq("id", car.id);
      if (error) throw error;
      toast({
        title: "Bil uppdaterad!"
      });
      onCarUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Fel vid uppdatering av bil",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-card border-border/50 shadow-elegant">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Redigera bil
          </DialogTitle>
          <DialogDescription>Uppdatera biluppgifter</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Namn</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} disabled={loading} placeholder="Bilens namn..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration_number">Registreringsnummer</Label>
            <Input id="registration_number" value={formData.registration_number} onChange={e => setFormData({
            ...formData,
            registration_number: e.target.value
          })} disabled={loading} />
          </div>

          

          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => setFormData({
            ...formData,
            notes: e.target.value
          })} disabled={loading} rows={5} placeholder="Interna anteckningar..." />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sparar..." : "Spara"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};
export default EditCarDialog;