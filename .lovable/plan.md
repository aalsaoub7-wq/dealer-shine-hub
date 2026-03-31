

# Fix: Garantera att fel bild aldrig visas i position editor

## Problem
Trots `setPositionEditorPhoto(null)` och flow ID guards kan asynkrona callbacks fortfarande sätta `positionEditorPhoto` till en gammal bild i ett kort ögonblick innan den nya segmenteringen är klar. State-baserade guards räcker inte — vi behöver en render-level guard.

## Lösning
Lägg till en beräknad variabel precis före `<CarPositionEditor>` som **bara tillåter rendering om `positionEditorPhoto.id` matchar den bild som faktiskt ska redigeras** enligt den aktiva kön (editFlowQueue eller interiorImageFlowQueue).

Om ingen kö är aktiv (manuell enskild redigering) visas editorn som vanligt.

### Ändring i `src/pages/CarDetail.tsx`

**Precis före `<CarPositionEditor>` (rad ~2324), lägg till:**

```typescript
// Compute which photo ID the active queue expects
const expectedEditorPhotoId = editFlowQueue
  ? editFlowQueue.photos[editFlowQueue.currentIndex]?.id
  : interiorImageFlowQueue
    ? interiorImageFlowQueue.photos[interiorImageFlowQueue.currentIndex]?.id
    : positionEditorPhoto?.id; // No queue = any photo is fine

const safePositionEditorPhoto =
  positionEditorPhoto?.id === expectedEditorPhotoId ? positionEditorPhoto : null;
```

**Ändra sedan `open` och alla `positionEditorPhoto`-referenser i JSX:en:**

```tsx
<CarPositionEditor
  open={!!safePositionEditorPhoto}
  ...
  transparentCarUrl={safePositionEditorPhoto?.transparentCarUrl || ""}
  backgroundUrl={safePositionEditorPhoto?.backgroundImageUrl || backgroundUrl}
  backgroundColor={safePositionEditorPhoto?.backgroundColor}
  isInterior={safePositionEditorPhoto?.editType === 'interior'}
  moveBackground={safePositionEditorPhoto?.moveBackground}
  fillCanvas={safePositionEditorPhoto?.moveBackground || (safePositionEditorPhoto?.editType === 'interior' && !!safePositionEditorPhoto?.backgroundColor)}
  ...
/>
```

`onOpenChange` och `onSave` behåller sina referenser till `positionEditorPhoto` (inte `safe`-varianten) eftersom de bara anropas när editorn är öppen.

## Vad som INTE ändras
- Inga setters ändras
- Ingen kö-logik ändras
- CarPositionEditor-komponenten — orörd
- Interiör/AI-flöden — orörda
- Edge functions — orörda

## Varför detta garanterar fixet
Även om en stale callback sätter `positionEditorPhoto` till bild 1, kommer `safePositionEditorPhoto` att vara `null` (eftersom köns `currentIndex` pekar på bild 2). Editorn öppnas aldrig med fel bild. Punkt.

## Risk
Extremt låg. Två beräknade variabler + inga logikändringar.

