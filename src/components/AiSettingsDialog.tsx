import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AiSettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const [backgroundPrompt, setBackgroundPrompt] = useState(
    'car on on clean ceramic floor with the colour #c8cfdb, with Plain white walls in the backgrond in the background, evenly lit'
  );
  const [exampleDescriptions, setExampleDescriptions] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_settings')
        .select('background_prompt, example_descriptions, logo_url')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setBackgroundPrompt(data.background_prompt);
        setExampleDescriptions(data.example_descriptions || '');
        setLogoUrl(data.logo_url || '');
      }
    } catch (error: any) {
      console.error('Error loading AI settings:', error);
      toast({
        title: "Fel vid laddning av inställningar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Inte inloggad');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('car-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('car-photos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      
      toast({
        title: "Logotyp uppladdad",
        description: "Din logotyp har laddats upp",
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Fel vid uppladdning",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Inte inloggad');

      const { error } = await supabase
        .from('ai_settings')
        .upsert({
          user_id: user.id,
          background_prompt: backgroundPrompt,
          example_descriptions: exampleDescriptions,
          logo_url: logoUrl,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Inställningar sparade",
        description: "AI-inställningarna har uppdaterats",
      });
      setOpen(false);
    } catch (error: any) {
      console.error('Error saving AI settings:', error);
      toast({
        title: "Fel vid sparande",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Ställ in AI för bakgrund och beskrivning
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI-inställningar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="logo">Logotyp för vattenmärke</Label>
            <div className="flex flex-col gap-2">
              {logoUrl ? (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                  <img src={logoUrl} alt="Logotyp" className="w-full h-full object-contain p-2" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={handleRemoveLogo}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={uploadingLogo}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingLogo ? "Laddar upp..." : "Ladda upp logotyp"}
                  </Button>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Denna logotyp placeras som vattenmärke på dina bilder
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="background-prompt">
              Instruktioner (prompt) för bakgrunden
            </Label>
            <Textarea
              id="background-prompt"
              value={backgroundPrompt}
              onChange={(e) => setBackgroundPrompt(e.target.value)}
              placeholder="Beskriv hur bakgrunden ska se ut..."
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="example-descriptions">
              Exempel Beskrivningar
            </Label>
            <Textarea
              id="example-descriptions"
              value={exampleDescriptions}
              onChange={(e) => setExampleDescriptions(e.target.value)}
              placeholder="Lägg till exempel på beskrivningar..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            {loading ? "Sparar..." : "Spara"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
