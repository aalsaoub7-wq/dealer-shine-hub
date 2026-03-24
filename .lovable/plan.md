

# Parallellisera AI-redigerings-flödet: segment + position SEDAN Gemini

## Problem
Idag bearbetas bilder helt sekventiellt: bild 1 segmenteras → positioneras → Gemini klar → SEDAN bild 2 segmenteras → etc. Användaren väntar i onödan.

## Nytt flöde
```text
Alla bilder segmenteras parallellt (remove.bg)
↓
Position editors visas en i taget (sekventiellt — kräver manuell interaktion)
↓
Varje bild skickas till Gemini direkt efter positionering (i bakgrunden, max 2 samtidigt)
```

Nyckeln: `advanceEditFlowQueue()` anropas direkt efter att position editor stängs, INTE efter Gemini. Gemini körs i bakgrunden med en concurrency-begränsad kö (max 2 parallella).

## Ändring

**Enda fil:** `src/pages/CarDetail.tsx`

### 1. Ändra `handleEditPhotos` (~rad 640-648)
Starta ALLA segment-car-anrop parallellt istället för bara första bilden. Spara resultaten (transparent URLs) i en ref/state. Öppna position editor för första bilden så snart DEN är klar (behöver inte vänta på alla).

### 2. Ny ref: `geminiQueueRef`
En ref som håller en kö av Gemini-jobb (compositionBlob + metadata). En worker-funktion processar dem max 2 åt gången — exakt samma mönster som interiör-kön (rad 780-900).

### 3. Ändra `editFlowQueue` state
Utöka med `segmentResults: Map<string, string>` för att lagra transparent URLs per photo.id allteftersom segment-car-anropen blir klara.

### 4. Ändra `handlePositionEditorSave` (isFromEditFlow-grenen, ~rad 1272-1332)
- Lägg till Gemini-jobbet i `geminiQueueRef` kön istället för att köra det inline
- Anropa `advanceEditFlowQueue()` DIREKT (inte efter Gemini)
- Starta gemini-workern om den inte redan kör

### 5. Ändra `advanceEditFlowQueue` (~rad 713-726)
Istället för att anropa `processEditFlowPhoto` (som gör segment-car), öppna position editor direkt med redan-redo transparent URL från `segmentResults`.

### 6. Ny funktion: `processGeminiQueue`
Samma mönster som `processNextInterior` (rad 785):
```text
const MAX_CONCURRENT_GEMINI = 2;
// Tar jobb från geminiQueueRef, kör add-reflection, uppdaterar DB
// Max 2 parallella
```

## Detaljerat steg-för-steg

1. Användaren markerar 5 bilder, klickar AI-redigera
2. `handleEditPhotos` startar 5 parallella segment-car-anrop
3. Så fort bild 1 är segmenterad → öppna position editor
4. Under tiden fortsätter segment-car för bild 2-5 i bakgrunden
5. Användaren sparar position för bild 1 → Gemini-jobb läggs i kö → position editor öppnas för bild 2 (om segmenterad, annars vänta)
6. Gemini-workern processar bild 1 i bakgrunden
7. Användaren sparar bild 2 → Gemini-jobb i kö → position editor för bild 3
8. Gemini-workern kan nu köra bild 1 + 2 parallellt (max 2)
9. Osv tills alla bilder är klara

## Vad som INTE ändras
- CarPositionEditor-komponenten — orörd
- Interiör-flödet — orört
- "Justera position"-knappen — orört
- Edge functions — orörda
- Gemini-anropets logik — identisk, bara köad

## Risk
Låg. Befintlig logik återanvänds. Gemini-kön använder samma beprövade mönster som interiör-kön. Segment-car stöder redan parallella anrop (det är bara remove.bg API). Ingen ny edge function, ingen DB-ändring.

