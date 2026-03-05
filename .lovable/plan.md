

# Dubbelkoll: Blocket/Bytbil API - Hittade problem

## Problem 1: Status-badges visar aldrig "Synkad" (KRITISKT)

I `PlatformSyncDialog.tsx` rad 125-143 kollar `getPlatformStatus` efter `last_action_state === "success"` och `"pending"`. Men enligt API-dokumentationen och `blocketSyncService.ts` (rad 191) skrivs statusvärdena `"processing"`, `"done"` och `"error"` till databasen. 

Resultatet: Status-badgen visar aldrig "Synkad" eller "Pågående" i UI:t, trots att synken faktiskt lyckas.

**Fix:** Ändra `"success"` → `"done"` och `"pending"` → `"processing"` i `getPlatformStatus` för både blocket och bytbil.

## Problem 2: Dubbel-synk vid val av både Blocket OCH Bytbil

Eftersom Blocket och Bytbil delar samma API (Pro Import API v3, category_id 1020), publiceras annonsen automatiskt på BÅDA plattformarna vid ett enda API-anrop. Om användaren väljer både Blocket och Bytbil i dialogen, anropas `syncToBlocket()` **två gånger** med potentiellt olika bilder — den andra överskriver den första.

**Fix:** När båda är valda, kör bara EN synk (Blocket-synken) och visa ett meddelande att Bytbil inkluderas automatiskt. Skippa den separata Bytbil-bilväljaren om Blocket redan är vald.

## Ändringar

### Fil: `src/components/PlatformSyncDialog.tsx`

1. **`getPlatformStatus`** (rad 125-144): Ändra `"success"` → `"done"` och `"pending"` → `"processing"` för Blocket och Bytbil.

2. **`handleBlocketSync`** (rad 284-305): Om Bytbil också är vald, skippa Bytbil-bilväljaren (annonsen publiceras redan på båda). Gå direkt till Wayke om den är vald.

3. **`handleSync`** (rad 250-282): Om både Blocket och Bytbil är valda, gå direkt till Blocket-flödet (som automatiskt täcker Bytbil).

## Vad som INTE ändras
- Backend-kod (edge functions, sync service, client)
- Databas
- Wayke-logik

## Risknivå
Mycket låg. Två isolerade frontend-fixar: statusmappning och borttagning av redundant API-anrop.

