
# Fix: Logotyper raderas av storage-cleanup

## Problem
Storage-cleanup edge function (`supabase/functions/storage-cleanup/index.ts`) raderar alla filer i `car-photos` bucketen som inte refereras i `photos`-tabellen efter 7 dagar. Logotyper lagras under `logos/` i samma bucket men refereras i `ai_settings.logo_url` — inte i `photos`. Därför behandlas de som "orphans" och raderas.

## Fix
**Fil:** `supabase/functions/storage-cleanup/index.ts` — Lägg till en rad i walk-callbacken (efter rad 88) som skippar alla filer under `logos/`-pathen:

```ts
// Never delete logo files — referenced from ai_settings, not photos
if (fullPath.startsWith("logos/")) return;
```

## Konsekvensanalys
- **Påverkar bara:** storage-cleanup funktionen.
- **Ingen annan ändring** — inga andra filer, flöden, tabeller eller edge functions berörs.
- Logotyper som laddas upp via AiSettingsDialog sparas permanent.
- Alla andra cleanup-regler (transparent cache 30d, övriga orphans 7d) fungerar exakt som förut.
