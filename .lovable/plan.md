

## Fix: share-preview returnerar 404

### Problem
`share-preview` returnerar 404 ("Requested function was not found") trots att filen finns och config.toml är korrekt. Alla andra funktioner fungerar.

### Orsak
`share-preview` använder `Deno.serve()` direkt, medan ALLA andra fungerande funktioner (t.ex. `get-billing-info`, `init-templates`) använder:
```text
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async (req) => { ... });
```
Supabase edge runtime känner inte igen `Deno.serve()` som en giltig entry point och returnerar 404.

### Vad som ändras

**En enda fil**: `supabase/functions/share-preview/index.ts`

Ändringarna:
1. Lägg till `import { serve }` från deno std (rad 1)
2. Byt `Deno.serve(async (req) => {` till `serve(async (req) => {`
3. All logik (hämta data, bygga OG-taggar, redirect) förblir exakt samma

### Vad som INTE ändras
- Ingen annan fil rörs
- CarDetail.tsx -- orörd
- config.toml -- orörd
- Inga andra edge-funktioner påverkas
- Ingen databas ändras

### Teknisk detalj

Före (fungerar INTE -- 404):
```text
Deno.serve(async (req) => {
  ...
});
```

Efter (samma mönster som alla 29 andra fungerande funktioner):
```text
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  ...
});
```

### Verifiering
Efter deploy: anropa funktionen direkt med en test-token och bekräfta att den returnerar HTML med status 200 istället för 404.

