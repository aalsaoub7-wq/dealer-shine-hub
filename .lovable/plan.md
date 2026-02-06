

## Fix share-preview: Byt till standard serve-wrapper

### Problem
`share-preview` returnerar fortfarande 404 eftersom den använder `Deno.serve()` direkt. Den förra godkända ändringen applicerades aldrig -- filen är oförändrad.

### Ändring

**En enda fil**: `supabase/functions/share-preview/index.ts`

Rad 1: Lägg till import:
```
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
```

Rad 10: Byt `Deno.serve(async (req) => {` till `serve(async (req) => {`

All övrig logik (CORS, databasfrågor, OG-taggar, redirect) förblir identisk.

### Vad som INTE ändras
- Ingen annan fil rörs
- config.toml -- orörd
- Inga andra edge-funktioner påverkas
- Ingen databas ändras
- Ingen frontend-kod ändras

### Verifiering efter deploy
Anropa funktionen direkt med en test-token för att bekräfta att den svarar med status 200 och HTML istället för 404.

