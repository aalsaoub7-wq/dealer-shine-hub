

# Dubbelkoll Blocket-integration — kvarvarande problem

Jag jämförde kod mot YAML (Pro Import API v3 / category 1020). Service och typer är korrekta enligt spec, men edge-funktionen och en validerings-detalj behöver fixas. Annars kommer riktiga synkar att slå fel.

## Problem som hittades

### 1. `blocket-sync/index.ts` skickar fortfarande `DEMO_DEALER` som dealer_code
Rad 87: `dealerCode: aiSettings?.blocket_dealer_code || ... || "DEMO_DEALER"`

Detta gör att om användaren lämnar dealer-kod tomt (vilket är **rätt** för token-scope `dealer_code`) så skickas ändå `"DEMO_DEALER"` till Blocket → API:t avvisar med `unauthorized` eller `invalid dealer_code`. Service-lagret är redan korrekt (tar inte med fältet om det är tomt), men edge-funktionen tvingar fram ett värde innan det når servicelagret.

**Fix:** `dealerCode: aiSettings?.blocket_dealer_code?.trim() || undefined` (släpp env-fallback och DEMO-default helt). dealerName/Phone/Email behöver inte skickas alls — service-lagret använder dem inte.

### 2. `validateAd` använder fel endpoint
Klienten anropar `POST /ad/validate` (rad 117 i `blocketClient.ts`). Enligt YAML är det korrekta `POST /ad/{source_id}/validate` (path-param) eller `POST /ad/validate` finns inte i v3-specen — validering sker som dry-run mot create. Behöver verifieras mot YAML innan vi kallar den.

**Fix:** Antingen ta bort `validateAd`-anropet (vi får ändå riktiga valideringsfel från `createAd`/`updateAd` som bubblar upp) eller använda korrekt path enligt YAML. Säkraste vägen nu = ta bort dubbelanropet och låta create/update själva returnera valideringsfel. Det halverar även latensen.

### 3. Edge-funktionen sväljer riktiga felmeddelanden
Rad 106: returnerar generisk `"An internal error occurred while syncing to Blocket"` istället för det faktiska felet från Blocket.

**Fix:** Returnera `error: error?.message || "..."` så användaren ser exakt vad Blocket klagar på (t.ex. "missing required field body_type").

### 4. Placeholder-strategin gör annonsen alltid osynlig idag
`body_type` finns inte på `cars`-raden, så `bodyType = "FYLL"` alltid → `usedPlaceholder = true` alltid → `visible: false` alltid. Detta är **medvetet och rätt** enligt din regel ("alla fält saknas → FYLL + visible:false"), men värt att veta: ingen annons blir publik förrän vi lägger till `body_type` på bilen. Ingen ändring krävs nu — bara bekräfta att det är förväntat.

### 5. Loggning av faktisk payload saknas
Vid felsökning är det svårt att se vad som faktiskt skickades. Lägg till en `console.log("[BlocketClient] payload:", JSON.stringify(payload))` i `createAd`/`updateAd` (utan token).

## Det som är korrekt redan

- Auth-header `X-Auth-Token` ✓
- `BASE_URL` `https://api.blocket.se/pro-import-api/v3` ✓
- `category_id: 1020` ✓
- Inga `title` eller `contact` skickas ✓
- `condition.mileage = { value, unit: "km" }` (nästlad) ✓
- `powertrain.fuels` / `powertrain.transmission` med korrekta enums ✓
- POST vid första sync, PUT vid efterföljande (via `state === "created"`-check) ✓
- `image_urls` cap på 38 + http(s)-filter ✓
- Service-lagret skickar `dealer_code` endast om ifyllt ✓
- UI fråga efter "X-Auth-Token" från butikssupport ✓
- Bytbil markerad som "Ingår automatiskt" ✓

## Filer att ändra

- `supabase/functions/blocket-sync/index.ts` — ta bort `DEMO_DEALER` och dummy-defaults; bubbla upp riktiga felmeddelanden i 500-svaret
- `supabase/functions/_shared/blocket/blocketClient.ts` — ta bort `validateAd` (eller bekräfta korrekt path mot YAML); logga payload vid create/update
- `supabase/functions/_shared/blocket/blocketSyncService.ts` — ta bort de två `validateAd`-anropen i create/update (felen kommer från själva create/update istället)

## Risk

Låg. Borttagningen av `DEMO_DEALER` är en bugfix — nuvarande kod skickar garanterat trasiga payloads när dealer-koden lämnas tom. Borttagning av separat `validateAd` minskar risken för felaktiga 404-fel från fel endpoint.

