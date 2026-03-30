

# Fix: Bild 1 flashar i position editor när man startar ny redigering

## Problem
När man AI-redigerar bild 2 medan bild 1 fortfarande behandlas i Gemini, dyker bild 1 upp kort i position editorn innan bild 2 visas. Detta beror troligen på att `positionEditorPhoto` inte rensas explicit vid starten av ett nytt redigeringsflöde, vilket kan leda till att gammal data visas kort.

## Lösning
En enda rad: lägg till `setPositionEditorPhoto(null)` i början av `handleEditPhotos`, innan den nya `editFlowQueue` skapas. Detta garanterar att eventuell kvarvarande state från ett tidigare flöde rensas innan nya bilder segmenteras.

### Ändring i `src/pages/CarDetail.tsx`

Vid ~rad 658 (precis före `setEditFlowQueue`), lägg till:
```typescript
// Clear any stale position editor state from previous flow
setPositionEditorPhoto(null);
```

## Vad som INTE ändras
- Allt annat i `handleEditPhotos` — orört
- CarPositionEditor — orörd  
- Interiör-flödet — orört
- Gemini-kön — orörd
- Edge functions — orörda

## Risk
Extremt låg. En enda `setPositionEditorPhoto(null)` som sätter redan-null-state till null, eller rensar stale state. Ingen ny logik.

