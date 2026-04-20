

# Mål: skicka bilder till Blocket — befintlig annons eller ny utkasts-annons

## Svar på frågan

Enligt YAML och client docs fungerar det så här:

- `source_id` är **vår** unika identifierare per butik (vi använder `car.id`).
- **Första gången** vi anropar `POST /v3/ad` med ett `source_id` → Blocket **skapar en ny annons**.
- **Andra gången** med samma `source_id` → vi måste använda `PUT /v3/ad/{source_id}` för att **uppdatera** den befintliga annonsen.

Det finns alltså inte "skicka bara bilder till en befintlig Blocket-annons som skapats utanför vårt system". Allt vi synkar blir en annons som **vi äger via vårt source_id**. Vår nuvarande kod hanterar redan det här (`blocket_ad_sync.state === "created"` → kör update).

## Din regel om "FYLL"

Eftersom YAML kräver `brand`, `model`, `model_year`, `body_type`, `price`, `body`, samt vissa `category_fields` — och du vill kunna skicka över bara registreringsnumret — fyller vi alla saknade obligatoriska fält med säkra placeholder-värden. Blocket har dock typade enums och numeriska fält där strängen `"FYLL"` skulle ge valideringsfel. Vi använder därför:

| Fält | Typ enligt YAML | Placeholder |
|---|---|---|
| `brand` | string ≤32 | `"FYLL"` |
| `model` | string ≤64 | `"FYLL"` |
| `model_year` | int 1900–2100 | `1900` |
| `body_type` | string ≤24 | `"FYLL"` |
| `body` (beskrivning) | string | `"FYLL"` |
| `price[0].amount` | int | `1` |
| `condition.mileage.value` | int | `0` (enhet `km`) |
| `powertrain.fuels` | enum | utelämnas (frivilligt) |
| `powertrain.transmission` | enum | utelämnas (frivilligt) |
| `registration_number` | string ≤6 | **bilens faktiska reg.nr** |

Annonsen skapas också med `visible: false` när inga riktiga fält finns ifyllda — så ingen offentlig publicering eller debitering sker innan användaren har kompletterat datan i Blocket Admin (eller hos oss och synkar igen). Detta följer Blockets egen testrekommendation.

## Flöde efter ändring

```text
Användare väljer bil + bilder → klickar "Synka till Blocket"
         │
         ├── Finns blocket_ad_sync.state === "created" för car.id?
         │      ├── Ja → PUT /v3/ad/{car.id}  (uppdaterar befintlig annons + bilder)
         │      └── Nej → POST /v3/ad         (skapar ny annons med source_id = car.id)
         │
         ├── För varje fält:
         │      ├── Finns värde på cars-raden? → använd det
         │      └── Saknas?                    → använd placeholder ("FYLL"/0/1900)
         │
         ├── visible = (alla obligatoriska fält har riktiga värden) ? true : false
         └── Spara state i blocket_ad_sync (created/updated, ev. blocket_ad_id)
```

## Ändringar i koden

### 1. `supabase/functions/_shared/blocket/blocketSyncService.ts`
- Skriv om `mapCarToBlocketPayload` enligt YAML:n:
  - Plocka bort `title` och `contact` (förbjudna för 1020).
  - Bygg `condition.mileage = { value, unit: "km" }`.
  - Bygg `powertrain = { fuels: [...], transmission: ... }` — utelämn fält som saknas.
  - Lägg in `brand`, `model`, `model_year`, `body_type` med placeholder-fallback.
  - `dealer_code` skickas **endast** om credentials.dealerCode är ifyllt.
  - Cap `image_urls` till 38, behåll endast http(s)-URL:er.
  - Sätt `visible: false` om någon obligatorisk fält fortfarande har placeholder.
- Ta bort fallback-defaults (`DEMO_DEALER`, dummy-mail/telefon) — kasta tydligt fel om token saknas.
- Låt `validateAd`-fel bubbla upp i `syncCar` (inte sväljas).
- Behåll befintlig create-vs-update-logik (bygger redan på `state === "created"`).

### 2. `supabase/functions/_shared/blocket/blocketTypes.ts`
Uppdatera typer för Car / CarPowerTrain / CarAndTransportCondition enligt YAML.

### 3. `src/components/PlatformSyncDialog.tsx`
- Förenkla Blocket-formuläret till **bara**:
  - **API-token** (krävs)
  - **Dealer-kod** (valfritt — text: "Endast om token-scope är dealer_group")
- Ta bort fälten dealer_name / phone / email (Blocket använder butiksinfo).
- Ta bort `DEMO_DEALER`-placeholder.
- Markera Bytbil i platforms-listan som **"Ingår automatiskt med Blocket"** (inte "Kommer snart").
- Lägg en infoton: "Saknade fält fylls med placeholder och annonsen skapas dold (visible: false) tills du kompletterat informationen."

### 4. `BLOCKET_INTEGRATION.md`
Uppdatera krav (token + ev. dealer_code), payload-exempel med nästlad struktur, och placeholder/visible-strategin.

## Det som **inte** ändras

- `cars`-tabellen får ingen ny `body_type`-kolumn nu — vi använder placeholder istället. (Kan läggas till senare när du vill exponera det i UI.)
- Wayke-flödet rörs inte.
- RLS / auth oförändrat.

## Risk

Låg–medel. Payload-strukturen ändras, men `visible: false`-säkerheten gör att inga oavsiktliga publika annonser skapas under övergången. Befintliga synkade annonser uppdateras via PUT med ny struktur.

