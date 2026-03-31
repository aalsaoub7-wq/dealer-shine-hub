

# Fix: Spara transparent_url när användaren stänger position editor (klickar X)

## Problem
När användaren AI-redigerar en bild, segmenteras den via remove.bg. Om användaren sedan klickar X i position editorn istället för att spara, går den transparenta bilden förlorad. Vid nästa försök måste remove.bg köras om i onödan.

## Lösning

**Enda fil:** `src/pages/CarDetail.tsx`

### Ändring i `onOpenChange`-handleren (~rad 2337–2347)

När `open` blir `false` (användaren stänger editorn), spara `transparent_url` och `original_url` till databasen innan state rensas:

```typescript
onOpenChange={(open) => {
  if (!open) {
    // Save transparent_url so remove.bg doesn't need to run again
    if (positionEditorPhoto?.id && positionEditorPhoto?.transparentCarUrl) {
      const photoInQueue = editFlowQueue?.photos[editFlowQueue.currentIndex];
      supabase.from("photos").update({ 
        transparent_url: positionEditorPhoto.transparentCarUrl,
        original_url: photoInQueue?.original_url || photoInQueue?.url,
        is_processing: false,
      }).eq("id", positionEditorPhoto.id);
    }
    if (positionEditorPhoto?.fromEditFlow) {
      setEditFlowQueue(null);
    }
    if (interiorImageFlowQueue) {
      setInteriorImageFlowQueue(null);
    }
    setPositionEditorPhoto(null);
  }
}}
```

Vi behöver inte `await`-a — det är en fire-and-forget DB-update som inte påverkar UI-flödet.

## Vad som INTE ändras
- Sparflödet (onSave) — orört
- Gemini-kön — orörd
- Interiör-flöden — orörda
- Edge functions — orörda
- Billing — orört (ingen trackUsage vid cancel)

## Risk
Extremt låg. En DB-update läggs till i close-handleren med data som redan finns i state.

