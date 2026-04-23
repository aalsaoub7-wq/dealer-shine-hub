# Varför Cloud-användningen sköt i höjden — och hur vi krymper den utan att röra funktionalitet

Jag granskade databasen, storage och edge function-loggarna. Det finns **fyra konkreta orsaker** och alla kan åtgärdas helt utan att påverka appen. Inga features försvinner, ingen kod i UI:t ändras, inga URL:er går sönder.

## Vad jag hittade (faktiska siffror)

### 1. 🚨 Trasigt cron-jobb spammar databasen varje minut sedan **15 nov 2025**

- Cron-jobbet `process-pending-photo-edits` har körts **229 046 gånger** (varje minut, 5+ månader).
- **Varje** körning misslyckas med `PGRST205: Could not find the table 'public.pending_photo_edits'` — tabellen finns inte längre.
- Resultat: 360 misslyckade HTTP-svar bara idag, edge function-invokationer dygnet runt, och `cron.job_run_details` har vuxit till **143 MB** med 214 651 rader skräp.
- **Edge function `process-pending-edits` är helt inaktiv för verklig logik** — den gör ingenting nyttigt, bara loggar fel.

### 2. 🚨 862 MB föräldralösa "transparent"-cachefiler i Storage

- 634 transparent-PNG (remove.bg-cache) tar **2 245 MB**.
- **207 av dem (862 MB)** refereras inte längre av någon rad i `photos`-tabellen — bilen/fotot är raderat eller cachen är överskriven.
- Cache-strategin är korrekt (memory: `parallel-editing-and-caching-logic`), men gamla poster städas aldrig.

### 3. 🚨 1 159 MB föräldralösa original/edited/watermark-filer

- 795 filer i `car-photos` som inte refereras av någon `photos`-rad alls.
- Sannolikt rester från raderade bilar, misslyckade uppladdningar, gamla edits.

### 4. Storage totalt: 5 888 MB

- Kategori-fördelning: transparent 2245 MB, original 2189 MB, edited 1036 MB, watermarked 415 MB.
- PNG-filer dominerar (3 779 MB) med snitt 2,1 MB/styck.

## Plan — 4 åtgärder, alla noll-risk

### Åtgärd 1: Stoppa det trasiga cron-jobbet (största vinsten)

**Vad:** Migration som kör `SELECT cron.unschedule('process-pending-photo-edits');` och raderar den döda edge function-koden.
**Effekt:** 

- Slutar generera ~43 200 misslyckade edge function-invokationer/månad direkt.
- Slutar fylla `cron.job_run_details` (143 MB → krymper när autovacuum kör).
- Slutar fylla `net._http_response` (233 MB → krymper).
**Risk:** Noll. Funktionen har inte fungerat sedan 15 november — appen klarar sig uppenbarligen utan den.

### Åtgärd 2: Trunkera log-tabellerna

**Vad:** Migration som kör `TRUNCATE cron.job_run_details;` och `TRUNCATE net._http_response;`.
**Effekt:** Frigör direkt **376 MB** i databasen.
**Risk:** Noll. Det är bara historiska loggar från det trasiga jobbet.

### Åtgärd 3: Radera 862 MB föräldralösa transparent-cachefiler

**Vad:** Migration som hittar transparent-objekt i `storage.objects` som inte matchar något `photos.transparent_url`, och raderar dem via `storage.objects` DELETE.
**Effekt:** Frigör **862 MB** i Storage.
**Risk:** Noll. De refereras inte av någon photo-rad — kan inte påverka något UI. Live cache (de 427 som faktiskt används) rörs inte.

### Åtgärd 4: Radera 1 159 MB föräldralösa bildfiler

**Vad:** Samma princip för filer som inte matchar `photos.url` eller `photos.original_url`.
**Effekt:** Frigör **1 159 MB** i Storage.
**Risk:** Noll. För extra säkerhet exkluderar vi filer skapade senaste 24h (för att inte råka radera pågående uppladdningar).

## Total besparing


| Resurs                    | Före            | Efter     | Besparing             |
| ------------------------- | --------------- | --------- | --------------------- |
| Storage                   | 5 888 MB        | ~3 867 MB | **−2 021 MB (−34 %)** |
| Database                  | ~400 MB         | ~25 MB    | **−375 MB (−94 %)**   |
| Edge function calls/månad | ~43 200 onödiga | 0         | **−100 % onödiga**    |
| HTTP-egress från cron     | konstant        | 0         | **−100 %**            |


## Vad som **inte** ändras

- Ingen UI-kod, ingen komponent, inga URL:er, ingen funktionalitet.
- `parallel-editing-and-caching-logic` (transparent_url-cache) fortsätter exakt som idag — bara döda poster städas.
- Inga tabeller, kolumner, RLS-policys, edge functions som faktiskt används rörs.
- Wayke/Blocket/AI-flöden helt orörda.

## Filer som ändras

- En ny migration: `supabase/migrations/<timestamp>_cleanup_unused_resources.sql` (cron unschedule + truncates + storage deletes).
- Radera `supabase/functions/process-pending-edits/` (oanvänd, trasig sedan november).

## Bonus (Lägg till nu)

- **Lifecycle-policy** på Storage: auto-radera transparent-filer äldre än 30 dagar och föräldralösa filer äldre än 7 dagar via en ny cron + edge function. Förhindrar att problemet återkommer.