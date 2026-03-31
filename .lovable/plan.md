

# Fix: Bild 1 flashar i position editor — flow ID guard

## Problem
`setPositionEditorPhoto(null)` räcker inte. Den asynkrona segmenteringen från det *förra* flödet kan fortfarande resolve:a och skriva bild 1 till state innan det nya flödets segmentering hinner klart. Vi behöver ignorera callbacks från gamla flöden.

## Lösning
Lägg till en `useRef`-räknare (`editFlowIdRef`) som inkrementeras varje gång `handleEditPhotos` anropas. Alla ställen som sätter `positionEditorPhoto` efter en async operation kontrollerar att flow-ID:t fortfarande matchar. Om det inte matchar → ignorera (return early).

### Ändringar i `src/pages/CarDetail.tsx`

**1. Ny ref (~rad 132, efter positionEditorSaving)**
```typescript
const editFlowIdRef = useRef(0);
```

**2. I `handleEditPhotos` (~rad 658–659) — inkrementera räknaren**
```typescript
const flowId = ++editFlowIdRef.current;
setPositionEditorPhoto(null);
```

**3. Före `setPositionEditorPhoto` vid rad 721 (efter firstResult await)**
```typescript
if (flowId !== editFlowIdRef.current) return; // Stale flow
```

**4. I `advanceEditFlowQueue` (~rad 749, 762) och poll-callback (~rad 762)**
Dessa behöver inte guards — de anropas bara från `handlePositionEditorSave` som redan har rätt kontext, och `editFlowQueue` state ersätts helt av det nya flödet.

**5. I interiör-flödet — samma guards vid `setPositionEditorPhoto` efter async segmentering (~rad 2381, 2416)**
Fånga `editFlowIdRef.current` vid start, checka innan `setPositionEditorPhoto`.

## Vad som INTE ändras
- CarPositionEditor — orörd
- advanceEditFlowQueue-logiken — orörd (state-baserad, inte stale)
- handlePositionEditorSave — orörd
- Interiör solid-färg — orört
- Edge functions — orörda

## Risk
Extremt låg. En ref + 2–3 `if`-guards. Ingen logik ändras, bara tidiga returns för stale callbacks.

