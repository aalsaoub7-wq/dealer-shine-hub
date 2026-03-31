

# Fix: Universal render-level guard mot flash i position editor

## Problem
Render-guarden checkar bara köer. Men om man startar en ny redigering (enskild eller batch) medan en gammal async callback är inflight, kan stale data sättas till `positionEditorPhoto` i ett ögonblick där ingen kö finns eller kön inte matchar.

## Lösning
Lagra `editFlowIdRef.current` på varje `positionEditorPhoto`-objekt som en `flowId`-property. I render-guarden: checka att `positionEditorPhoto.flowId === editFlowIdRef.current`. Om det inte matchar → `safePhoto = null`.

### Ändringar i `src/pages/CarDetail.tsx`

**1. Lägg till `flowId` i alla `setPositionEditorPhoto({...})`-anrop**

Varje ställe som sätter `setPositionEditorPhoto({ id, transparentCarUrl, ... })` får en extra property: `flowId: editFlowIdRef.current`. Det finns ~10 ställen (rad 724, 752, 765, 797, 814, 1376, 1386, 1395, 2396, 2431). De som redan har `interiorFlowId` som lokal variabel använder den (den är redan `editFlowIdRef.current` vid tidpunkten).

**2. Förenkla render-guarden (rad 2325–2331)**

Ersätt den nuvarande kö-baserade guarden med:
```typescript
const safePhoto = positionEditorPhoto?.flowId === editFlowIdRef.current
  ? positionEditorPhoto
  : null;
```

**3. Vid enskild redigering ("Justera position", rad ~1370–1398)**

Lägg till `editFlowIdRef.current++` (eller `++editFlowIdRef.current`) innan `setPositionEditorPhoto` anropas, så att varje enskild öppning av editorn också får ett unikt flow ID.

## Vad som INTE ändras
- Inga setters-logik ändras
- Ingen kö-logik ändras
- CarPositionEditor — orörd
- Edge functions — orörda
- Alla flöden fungerar exakt som innan

## Risk
Extremt låg. Additivt: en extra property på ett objekt + en enklare guard.

