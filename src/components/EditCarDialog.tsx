import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
}

interface EditCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: CarData;
  onCarUpdated: () => void;
}

const EditCarDialog = ({ open, onOpenChange, car, onCarUpdated }: EditCarDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vin: "",
    color: "",
    mileage: "",
    price: "",
    registration_number: "",
    fuel: "",
    gearbox: "",
    description: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (car) {
      setFormData({
        make: car.make,
        model: car.model,
        year: car.year,
        vin: car.vin || "",
        color: car.color || "",
        mileage: car.mileage?.toString() || "",
        price: car.price?.toString() || "",
        registration_number: car.registration_number || "",
        fuel: car.fuel || "",
        gearbox: car.gearbox || "",
        description: car.description || "",
      });
    }
  }, [car]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("cars")
        .update({
          make: formData.make,
          model: formData.model,
          year: formData.year,
          vin: formData.vin || null,
          color: formData.color || null,
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          price: formData.price ? parseInt(formData.price) : null,
          registration_number: formData.registration_number || null,
          fuel: formData.fuel || null,
          gearbox: formData.gearbox || null,
          description: formData.description || null,
        })
        .eq("id", car.id);

      if (error) throw error;

      toast({ title: "Bil uppdaterad!" });
      onCarUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Fel vid uppdatering av bil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-card border-border/50 max-w-2xl shadow-intense animate-scale-in max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Redigera bil
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Uppdatera biluppgifterna nedan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Märke *</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modell *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">År *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Färg</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vin">Regnr (Registreringsnummer)</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Miltal (km)</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Pris (SEK)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="bg-secondary border-border"
                placeholder="Ex: 250000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuel">Bränsle</Label>
              <Input
                id="fuel"
                value={formData.fuel}
                onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                className="bg-secondary border-border"
                placeholder="Ex: Bensin, Diesel, El"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gearbox">Växellåda</Label>
              <Input
                id="gearbox"
                value={formData.gearbox}
                onChange={(e) => setFormData({ ...formData, gearbox: e.target.value })}
                className="bg-secondary border-border"
                placeholder="Ex: Manuell, Automat"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-secondary border-border min-h-[100px]"
              placeholder="Skriv en beskrivning av bilen..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="hover:scale-105 transition-transform duration-300"
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="hover:scale-105 transition-transform duration-300"
            >
              {loading ? "Sparar..." : "Spara ändringar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCarDialog;
