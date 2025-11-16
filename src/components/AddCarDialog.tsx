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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { trackUsage } from "@/lib/usageTracking";

interface AddCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCarAdded: () => void;
}

const AddCarDialog = ({ open, onOpenChange, onCarAdded }: AddCarDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vin: "",
    color: "",
    mileage: "",
    notes: "",
    price: "",
    registration_number: "",
    fuel: "",
    gearbox: "",
    description: "",
    publish_on_blocket: false,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Användare ej inloggad");

      const { data: userCompany, error: companyError } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (companyError) throw companyError;

      const { error } = await supabase.from("cars").insert({
        make: formData.make,
        model: formData.model,
        year: formData.year,
        vin: formData.vin || null,
        color: formData.color || null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        notes: formData.notes || null,
        price: formData.price ? parseInt(formData.price) : null,
        registration_number: formData.registration_number || null,
        fuel: formData.fuel || null,
        gearbox: formData.gearbox || null,
        description: formData.description || null,
        publish_on_blocket: formData.publish_on_blocket,
        company_id: userCompany.company_id,
      });

      if (error) throw error;

      // Track usage
      await trackUsage("add_car");

      toast({ title: "Bil tillagd!" });
      onCarAdded();
      onOpenChange(false);
      setFormData({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        vin: "",
        color: "",
        mileage: "",
        notes: "",
        price: "",
        registration_number: "",
        fuel: "",
        gearbox: "",
        description: "",
        publish_on_blocket: false,
      });
    } catch (error: any) {
      toast({
        title: "Fel vid tillägg av bil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    setGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-car-description', {
        body: {
          carData: {
            make: formData.make,
            model: formData.model,
            year: formData.year,
            mileage: formData.mileage,
            color: formData.color,
            fuel: formData.fuel,
            gearbox: formData.gearbox,
            price: formData.price,
            vin: formData.vin,
          }
        }
      });

      if (error) throw error;

      if (data?.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
        
        // Track usage
        await trackUsage("generate_description");
        
        toast({
          title: "Beskrivning genererad",
          description: "AI har skapat en beskrivning som du kan redigera",
        });
      }
    } catch (error: any) {
      console.error('Error generating description:', error);
      toast({
        title: "Fel vid generering",
        description: error.message || "Kunde inte generera beskrivning",
        variant: "destructive",
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-card border-border/50 max-w-2xl shadow-intense animate-scale-in max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Lägg till ny bil
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Ange biluppgifterna nedan. Du kan lägga till foton efter att bilen skapats.
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
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Beskrivning (för Blocket)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={generatingDescription || !formData.make || !formData.model}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generatingDescription ? "Genererar..." : "Generera Beskrivning med AI"}
              </Button>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-secondary border-border resize-none"
              rows={3}
              placeholder="Detaljerad beskrivning av bilen..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Interna anteckningar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-secondary border-border resize-none"
              rows={2}
              placeholder="Interna noteringar (syns inte på Blocket)"
            />
          </div>
          <div className="flex items-center space-x-2 p-4 bg-secondary/50 rounded-lg border border-border">
            <Switch
              id="publish_on_blocket"
              checked={formData.publish_on_blocket}
              onCheckedChange={(checked) => setFormData({ ...formData, publish_on_blocket: checked })}
            />
            <Label htmlFor="publish_on_blocket" className="cursor-pointer">
              Publicera på Blocket automatiskt
            </Label>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border hover:scale-105 transition-all duration-300"
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary hover:bg-gradient-hover shadow-glow hover:shadow-intense hover:scale-105 transition-all duration-300"
            >
              {loading ? "Lägger till..." : "Lägg till bil"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCarDialog;