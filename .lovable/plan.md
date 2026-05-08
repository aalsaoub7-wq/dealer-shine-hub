## Problem

Blocket avvisar bilen med 400 eftersom `brand`, `model` och `body_type` skickas som `"FYLL"` / `"Test För Johan"` — värden som inte finns i Blockets validerings­lista. Det blir omöjligt att synka ofullständiga bilar.

## Lösning

Byt ut placeholders i `mapCarToBlocketPayload` mot **giltiga** standardvärden som Blocket accepterar. Annonsen läggs upp som **osynlig** (precis som idag via `visible: false` när placeholder används), och användaren rättar sedan datan direkt i Blocket eller i Luvero.

## Ändring (1 fil)

**`supabase/functions/_shared/blocket/blocketSyncService.ts`** (rad 29–32, 126–155)

Lägg till nya konstanter och använd dem som fallback:

```ts
const PLACEHOLDER_BRAND = "Volvo";       // accepterat märke
const PLACEHOLDER_MODEL = "240";         // accepterad modell för Volvo
const PLACEHOLDER_BODY_TYPE = "sedan";   // giltig body_type
const PLACEHOLDER_TEXT = "FYLL";         // behålls för body/description
const PLACEHOLDER_YEAR = 1900;
const PLACEHOLDER_PRICE = 1;
```

I `mapCarToBlocketPayload`:
- `brand` → `PLACEHOLDER_BRAND` om tom
- `model` → `PLACEHOLDER_MODEL` om tom
- `bodyType` → `PLACEHOLDER_BODY_TYPE` (alltid, tills fältet finns på cars-tabellen)
- `usedPlaceholder`-flaggan justeras att jämföra mot de nya konstanterna så annonsen fortsatt blir `visible: false` när data saknas.

## Konsekvenser och säkerhet

- **Inga andra flöden påverkas.** Endast payload-mappningen ändras.
- Annonsen blir fortfarande **osynlig på Blocket** så länge placeholder används → ingen risk att en "Volvo 240 sedan från 1900 för 1 kr" syns publikt.
- Användaren ändrar enkelt fälten i Blockets gränssnitt eller fyller i bilen i Luvero och synkar igen.
- Frontend, edge function-routing, auth, DB-schema, Stripe — orört.

## Validering efter ändring

1. Synka samma testbil → ska returnera 200 från Blocket istället för 400.
2. Kolla edge function logs: `[BlocketClient] Creating ad with source_id: ...` följt av success, ingen `API error 400`.
3. Bekräfta i `blocket_ad_sync`-tabellen att `state = 'created'` och `last_error IS NULL`.
4. Bekräfta att bilen ligger som **dold/osynlig** i Blocket-portalen.
