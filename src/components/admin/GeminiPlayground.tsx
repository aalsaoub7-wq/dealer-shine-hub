import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MODEL_OPTIONS: { value: string; label: string }[] = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (preview)" },
  { value: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)" },
  { value: "google/gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite (preview)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "google/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image (Nano Banana)" },
  { value: "google/gemini-3-pro-image-preview", label: "Gemini 3 Pro Image (preview)" },
  { value: "google/gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash Image (Nano Banana 2)" },
  { value: "openai/gpt-5", label: "GPT-5" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { value: "openai/gpt-5-nano", label: "GPT-5 Nano" },
  { value: "openai/gpt-5.2", label: "GPT-5.2" },
  { value: "openai/gpt-5.4", label: "GPT-5.4" },
  { value: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini" },
  { value: "openai/gpt-5.4-nano", label: "GPT-5.4 Nano" },
  { value: "openai/gpt-5.4-pro", label: "GPT-5.4 Pro" },
  { value: "openai/gpt-5.5", label: "GPT-5.5" },
  { value: "openai/gpt-5.5-pro", label: "GPT-5.5 Pro" },
];
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

export default function GeminiPlayground() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("google/gemini-3-flash-preview");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [responseImages, setResponseImages] = useState<string[]>([]);
  const [hasResult, setHasResult] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
    arr.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url]);
    });
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const send = async () => {
    if (!prompt.trim() && files.length === 0) {
      toast.error("Skriv en prompt eller lägg till en bild");
      return;
    }
    setLoading(true);
    setResponse("");
    setResponseImages([]);
    setHasResult(false);
    try {
      const images = await Promise.all(files.map(fileToDataUrl));
      const { data, error } = await supabase.functions.invoke("gemini-playground", {
        body: { prompt, images, model },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResponse((data as any)?.text ?? "");
      setResponseImages(((data as any)?.images ?? []) as string[]);
      setHasResult(true);
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Något gick fel";
      toast.error(msg);
      setResponse(`Fel: ${msg}`);
      setHasResult(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gemini Test</CardTitle>
        <CardDescription>
          Skicka prompt + bilder direkt till Gemini via Lovable AI Gateway. Endast för admin-test, påverkar inga andra flöden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gp-model">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="gp-model">
              <SelectValue placeholder="Välj modell" />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gp-prompt">Prompt</Label>
          <Textarea
            id="gp-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Skriv din prompt här..."
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gp-files">Bilder (valfritt)</Label>
          <Input
            id="gp-files"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`preview-${i}`} className="h-20 w-20 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    aria-label="Ta bort bild"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={send} disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Skickar...</> : "Skicka"}
        </Button>

        {response && (
          <div className="space-y-2">
            <Label>Svar</Label>
            <div className="rounded-md border bg-muted p-4 whitespace-pre-wrap text-sm">{response}</div>
          </div>
        )}

        {responseImages.length > 0 && (
          <div className="space-y-2">
            <Label>Genererade bilder</Label>
            <div className="flex flex-wrap gap-3">
              {responseImages.map((src, i) => (
                <div key={i} className="space-y-1">
                  <img src={src} alt={`gemini-${i}`} className="max-h-96 rounded border" />
                  <a
                    href={src}
                    download={`gemini-${Date.now()}-${i}.png`}
                    className="text-xs underline block"
                  >
                    Ladda ner
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasResult && !response && responseImages.length === 0 && (
          <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">
            Modellen returnerade inget innehåll. Prova en annan modell eller justera prompten.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
