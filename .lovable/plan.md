# Plan

## Mål
Få Blocket-syncen att fungera även när bilens sparade `make`/`model` inte är giltiga Blocket-värden, istället för att hela flödet stoppar med ett 400-fel.

## Vad jag kommer att ändra

### 1. Härda backend-flödet i `supabase/functions/_shared/blocket/blocketSyncService.ts`
- Tolka Blockets 400-svar för ogiltigt `brand`/`model`.
- Om create/update faller på just dessa fält, göra **ett kontrollerat retry** med säkra Blocket-giltiga placeholders för märke/modell.
- Se till att annonsen då skapas/uppdateras som **dold** så inget felaktigt publiceras öppet.
- Behålla originalfelet i synkstatus så det går att se varför fallback användes.

### 2. Förbättra funktionssvaret i `supabase/functions/blocket-sync/index.ts`
- Returnera ett tydligare, strukturerat svar när fallback behövdes.
- Skilja mellan:
  - verkliga Blocket-fel som fortfarande ska stoppas
  - recoverable brand/model-fel som backend nu kan lösa automatiskt

### 3. Förbättra UI-feedback i `src/lib/blocket.ts` och/eller `src/hooks/useBlocketSync.ts`
- Visa ett begripligt meddelande i stället för rå JSON från Blocket.
- Exempel: att bilen synkades som dold annons eftersom märke/modell inte matchade Blockets register.
- Låta övriga fel fortsätta visas som vanliga fel.

### 4. Verifiera med den bil som felar nu
- Testa samma bil-id som gav felet (`a9cbd798-e6cd-446e-970d-30253efcbdd7`).
- Kontrollera att edge-funktionen inte längre returnerar 400/500 för detta scenario.
- Kontrollera att statusraden/toasten i UI blir begriplig.

## Tekniska detaljer
- **Ingen databasmigration behövs.**
- **Ingen ändring av bilformulären i detta steg.** Jag fixar blockeraren i sync-flödet först, med minimal risk.
- Rotorsaken jag bekräftade är att bilen i databasen just nu har:
  - `make = "Test För Johan"`
  - `model = ""`
- Nuvarande placeholder-logik täcker bara saknade värden, inte värden som är ifyllda men ogiltiga för Blocket. Det är därför felet fortfarande uppstår.

## Förväntat resultat
- Syncen går igenom även för bilar med ogiltigt sparat märke/modell.
- Annonsen hålls dold när fallback används.
- Användaren får ett tydligt meddelande i UI istället för rå Blocket-JSON.