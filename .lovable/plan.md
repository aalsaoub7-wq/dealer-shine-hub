
# Aktivera Bytbil-synk via befintlig Blocket API

## Bakgrund

Enligt den uppdaterade API-dokumentationen hanteras Blocket och Bytbil av **samma API** (Pro Import API v3). En annons som skapas for registrerade fordon (category_id 1020) publiceras automatiskt pa bade Blocket och Bytbil. Ingen separat integration behovs -- det ar redan implementerat i backend.

## Vad som andras

**Fil: `src/components/PlatformSyncDialog.tsx`**

### 1. Ta bort `comingSoon` fran Bytbil (rad 42)
- Andra `{ id: "bytbil", name: "Bytbil", logo: bytbilLogo, comingSoon: true }` till `{ id: "bytbil", name: "Bytbil", logo: bytbilLogo }`

### 2. Bytbil delar credentials med Blocket
- `hasBlocketCredentials()` ateranvands for Bytbil
- Nar man klickar pa Bytbil och credentials saknas visas Blocket-setup (samma uppgifter)
- Nar credentials finns visas bildvaljaren precis som for Blocket

### 3. Bytbil-synk anropar samma edge function
- Bytbil-synk anvander exakt samma `syncToBlocket()` funktion och samma bildvaljare
- Ny state: `showBytbilImagePicker`, `selectedBytbilImages`
- Ny handler `handleBytbilSync` som anropar `syncToBlocket(car, selectedBytbilImages)` (samma funktion)

### 4. Status for Bytbil
- `getPlatformStatus("bytbil")` returnerar samma status som Blocket (de delar sync-record)

### 5. Edit-knapp for Bytbil
- Visa samma edit-knapp som Blocket (pennaikon) nar `hasBlocketCredentials()` ar true
- Klick oppnar Blocket-setup-formularet (samma credentials)

## Vad som INTE andras
- Ingen backend-kod andras (edge functions, sync service, client)
- Ingen databasandring
- Wayke-logik rors inte
- Blocket-logik rors inte (Bytbil ateranvander den)

## Teknisk detalj

Bytbil-flodets steg:
1. Anvandaren valjer "Bytbil" i plattformslistan
2. Om Blocket-credentials saknas -> visa Blocket-setup (med text "Blocket/Bytbil")
3. Om credentials finns -> visa bildvaljare ("Skicka bilder till Bytbil")
4. Synka via `syncToBlocket()` -- samma API-anrop, publiceras automatiskt pa bada plattformar

## Riskniva
Extremt lag. Bytbil ateranvander 100% av befintlig Blocket-logik. Inga nya API-anrop, inga nya edge functions, inga databasandringar.
