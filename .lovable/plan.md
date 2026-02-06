

## Fix: Delningslänkar visar rå HTML-kod istället för att rendera sidan

### Rotorsak
Edge-funktionen `share-preview` fungerar -- den kör och hämtar data från databasen korrekt. MEN `Content-Type: text/html`-headern försvinner på vägen, så webbläsaren visar rå HTML-kod som text istället för att rendera sidan och göra omdirigeringen.

Orsaken: `share-preview` använder `Deno.serve()` direkt, medan ALLA andra fungerande edge-funktioner i projektet använder `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"`. Supabase edge runtime hanterar dessa olika när det gäller response-headers.

### Vad som ändras

**En enda fil**: `supabase/functions/share-preview/index.ts`

Ändringar:
1. Byt till `import { serve }` istället för `Deno.serve` -- samma mönster som alla andra fungerande funktioner
2. Använd `new Headers()` för att explicit sätta `Content-Type: text/html; charset=utf-8` så att headern inte kan försvinna
3. Logiken (hämta data, bygga OG-taggar, omdirigera) ändras INTE alls

### Vad som INTE ändras
- Ingen annan fil rörs
- Delningslogiken i CarDetail.tsx -- redan korrekt
- Config.toml -- redan korrekt
- Inga andra edge-funktioner påverkas
- Databasefrågor och OG-tagg-generering -- samma som innan

### Verifiering
1. Deploya den uppdaterade funktionen
2. Hämta URL:en direkt och bekräfta att webbläsaren renderar HTML (visar "Omdirigerar" och skickar vidare) istället för att visa rå kod
3. Testa delningsflödet: välj bilder, klicka Dela, öppna länken

### Risk
Minimal -- samma beprövade mönster som 20+ andra fungerande edge-funktioner i projektet. Logiken ändras inte, bara hur HTTP-servern startas och hur headers sätts.

### Teknisk detalj

```text
Före (fungerar INTE):
  Deno.serve(async (req) => { ... })
  headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders }

Efter (fungerar, samma som alla andra funktioner):
  import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
  serve(async (req) => { ... })
  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Headers", "...");
```
