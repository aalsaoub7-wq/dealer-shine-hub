

# Lägg till manuell positionering i AI-redigerings-flödet

## Nuvarande flöde (AI-redigera)
```text
Markera bilder → Skyltval → Per bild (max 2 parallellt):
  1. segment-car (remove.bg) → transparent PNG
  2. compositeCarOnBackground (auto-placering)
  3. add-reflection (Gemini)
```

## Nytt flöde
```text
Markera bilder → Skyltval → Per bild (sekventiellt):
  1. segment-car (remove.bg) → transparent PNG
  2. Visa CarPositionEditor → användaren placerar bilen manuellt
  3. add-reflection (Gemini) med användarens komposition
```

Bilder bearbetas en i taget eftersom varje bild kräver manuell interaktion (position editor). Om flera bilder: nästa bild dyker upp automatiskt efter att föregående sparats.

## Ändring

**Enda fil:** `src/pages/CarDetail.tsx`

### 1. Ny state — köhantering för edit-flödet (~rad 131)

Lägg till state för att hålla en kö av bilder som ska genom det nya flödet:

```typescript
const [editFlowQueue, setEditFlowQueue] = useState<{
  photos: Photo[];
  removePlate: boolean;
  currentIndex: number;
} | null>(null);
```

### 2. Ändra `handleEditPhotos` (~rad 592–773)

Dela upp funktionen:
- **Step 1 (segment-car)** körs som idag, men efter segmentering öppnas position editor istället för auto-compositing + Gemini
- Ingen parallellism behövs längre (en bild i taget p.g.a. manuell interaktion)

Ny logik:
1. Kör segment-car för första bilden i kön
2. Öppna position editor med `fromEditFlow: true` flagga
3. Vänta på att användaren sparar positionen

### 3. Utöka `positionEditorPhoto` state med `fromEditFlow`-flagga

Lägg till `fromEditFlow?: boolean` i det befintliga typet. Detta gör att `handlePositionEditorSave` kan skilja mellan "justera position" (befintligt) och "del av AI-redigering" (nytt).

### 4. Ändra `handlePositionEditorSave` (~rad 1289)

När `fromEditFlow` är true:
- Skicka compositionBlob till Gemini (add-reflection) som idag
- Uppdatera DB med alla fält (url, original_url, transparent_url, is_edited, edit_type, has_free_regeneration)
- Tracka usage
- Processa nästa bild i kön (kör segment-car → öppna position editor)

### 5. Ny funktion `processNextEditFlowPhoto`

Tar nästa bild ur kön, kör segment-car, och öppnar position editor. Om kön är tom, rensas edit flow state.

## Vad som INTE ändras

- CarPositionEditor-komponenten — orörd
- Interiör-flödet — orört
- "Justera position"-knappen — orört (fungerar exakt som innan)
- Alla andra flöden — orörda
- Edge functions — orörda
- Regenereringsfunktionen — orörd

## Risk

Låg. Befintlig `handleEditPhotos` ändras, men all befintlig logik (segment-car, position editor, Gemini-anrop) återanvänds. "Justera position"-flödet förblir orört tack vare `fromEditFlow`-flaggan. Ingen ny edge function, ingen DB-ändring.

