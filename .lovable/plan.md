# Lägg till Gemini-testflik i Admin

Mål: Ge dig en plats i `/admin` där du kan skicka en prompt + bilder till Gemini och se svaret. Allt isolerat — inga befintliga flöden rörs.

## Vad som ändras (minimalt)

### 1. `src/pages/Admin.tsx` (4 små additiva rader)
- Ändra `grid-cols-4` → `grid-cols-5` på `TabsList` (rad 553).
- Lägg till `<TabsTrigger value="gemini-test">Gemini Test</TabsTrigger>`.
- Lägg till `<TabsContent value="gemini-test">…<GeminiPlayground /></TabsContent>` i slutet av Tabs.
- Importera `GeminiPlayground`.

Inget annat i filen rörs. Default-tab är fortfarande `customers`.

### 2. Ny fil `src/components/admin/GeminiPlayground.tsx` (isolerad)
- Egen lokal state: `prompt`, `images: File[]`, `response`, `loading`.
- UI: Textarea för prompt, file input (multiple, accept image/*), liten thumbnail-preview, "Skicka"-knapp, response-area.
- Konverterar varje bild till base64 data URL i browsern.
- Anropar ny edge function `gemini-playground` via `supabase.functions.invoke`.
- Använder befintlig design (Card, Button, Textarea, Input). Inga nya deps.

### 3. Ny edge function `supabase/functions/gemini-playground/index.ts` (isolerad, ny)
- Standard CORS + JWT-validering på samma sätt som övriga functions.
- Tar `{ prompt: string, images: string[] (data URLs), model?: string }`.
- Anropar `https://ai.gateway.lovable.dev/v1/chat/completions` med `LOVABLE_API_KEY` (redan satt).
- Default-modell: `google/gemini-3-flash-preview` (multimodal).
- Skickar bilder som `image_url`-content-parts enligt OpenAI-kompatibelt format.
- Hanterar 429/402 och returnerar texten från `choices[0].message.content`.
- Ny config-block i `supabase/config.toml` behövs ej (default räcker).

## Konsekvensanalys

- **Inga ändringar** i: blocket-sync, wayke-sync, billing, leads, backgrounds, auth, RLS, DB-schema, storage, befintliga edge functions.
- **Admin.tsx**: enda diff är tabs grid-cols + ny trigger + ny TabsContent. Övriga tabs och deras logik orörda.
- **Ny edge function**: deployas separat, kan inte påverka existerande functions.
- **Ingen ny dependency** i package.json.
- **Inga DB-migrationer**.
- **Åtkomst**: Admin-routen är redan skyddad — ingen extra gating behövs. (Vill du dessutom låsa fliken till bara ditt admin-konto, säg till så lägger jag in samma `aalsaoub7@gmail.com`-check som Shield-ikonen, men det är inte nödvändigt eftersom hela /admin redan är admin-only.)

## Validering efter implementation

1. Bygg passerar (typecheck via harness).
2. Öppna `/admin` → klicka igenom Kunder/Leads/Bakgrunder/Billing → bekräfta att inget renderar fel.
3. Klicka nya fliken → skicka prompt utan bild → få svar.
4. Skicka prompt + 1 bild → få svar.
5. Inspektera Network: bara `gemini-playground` anropas, inga andra functions berörs.

## Tekniska detaljer

Edge function payload till AI-gateway:
```json
{
  "model": "google/gemini-3-flash-preview",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": "<prompt>" },
      { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }
    ]
  }]
}
```

Säg till om du vill att jag kör — då implementerar jag exakt detta utan scope-creep.
