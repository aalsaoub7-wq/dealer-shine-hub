

# Batch interiör-redigering med bakgrundsbild

## Problem
Solid-färg interiörredigering hanterar redan flera bilder. Men bakgrundsbild-interiör (`onImageSelected`) tar bara första markerade bilden — resten ignoreras.

## Lösning
Samma mönster som AI-redigerings-kön: segmentera alla bilder parallellt, öppna position editor sekventiellt (en i taget), spara varje bild direkt efter positionering.

## Ändring

**Enda fil:** `src/pages/CarDetail.tsx`

### 1. Ny state — kö för interiör-bakgrundsbild-flödet (~rad 170)

```typescript
const [interiorImageFlowQueue, setInteriorImageFlowQueue] = useState<{
  photos: Photo[];
  imageUrl: string;
  segmentResults: Map<string, string>; // photoId → transparentUrl
  currentIndex: number;
} | null>(null);
```

### 2. Ändra `onImageSelected`-callback (~rad 2257–2327)

Istället för att bara ta `photoIds[0]`:
1. Starta segment-car parallellt för ALLA markerade bilder
2. Spara resultaten i `segmentResults` Map
3. Öppna position editor för första bilden så snart DEN är segmenterad

### 3. Ny funktion: `advanceInteriorImageQueue`

Tar nästa bild ur kön. Om segmenterad → öppna position editor med `moveBackground: true`. Om inte klar → polla varje 500ms. Om kön är tom → rensa state.

### 4. Ändra `handlePositionEditorSave` — interior-grenen (~rad 1353–1375)

Lägg till check: om `interiorImageFlowQueue` finns, anropa `advanceInteriorImageQueue()` efter att bilden sparats (samma pattern som `advanceEditFlowQueue()`).

### 5. Cleanup vid stängning

Om position editor stängs under interiör-bild-flödet, rensa `interiorImageFlowQueue`.

## Steg-för-steg för användaren

1. Markera 5 bilder, klicka Interiör, välj bakgrundsbild
2. Alla 5 segmenteras parallellt i bakgrunden
3. Bild 1 klar → position editor öppnas (moveBackground mode)
4. Spara → bild laddas upp, DB uppdateras → bild 2 öppnas direkt
5. Osv tills alla 5 är klara

## Vad som INTE ändras
- Solid-färg interiör — orört (fungerar redan med batch)
- AI-redigerings-flödet — orört
- CarPositionEditor — orörd
- Edge functions — orörda
- "Justera position"-knappen — orörd

## Risk
Låg. Additivt — ny state + ny funktion. Befintlig interiör-sparlogik i `handlePositionEditorSave` återanvänds. Samma beprövade mönster som edit flow queue.

