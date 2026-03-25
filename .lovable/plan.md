

# Fix: Interiör batch — position direkt efter varandra utan att editorn stängs

## Problem
I `handlePositionEditorSave` (interior-grenen, rad 1413–1441) stängs editorn (`setPositionEditorPhoto(null)`) vid rad 1420, sedan körs upload + DB-sparning asynkront, och FÖRST efter att det är klart (rad 1433–1434) anropas `advanceInteriorImageQueue()`. Editorn stängs alltså och öppnas igen — användaren ser en blink/väntan.

## Lösning
Exakt samma mönster som edit flow (rad 1442–1461): kör upload/DB-sparning i bakgrunden (fire-and-forget), avancera kön DIREKT. Editorn byter bara ut bilden utan att stängas.

## Ändring

**Enda fil:** `src/pages/CarDetail.tsx`, rad 1413–1441

Ändra interior-grenen i `handlePositionEditorSave`:

1. Spara undan `bgImageUrl`, `hasInteriorQueue`, `photoId`
2. Om `hasInteriorQueue`: sätt INTE `positionEditorPhoto` till null — anropa `advanceInteriorImageQueue()` DIREKT (editorn förblir öppen med nästa bild)
3. Kör upload + DB-sparning i bakgrunden (utan await i huvudflödet) — samma fire-and-forget pattern som Gemini-kön
4. Om INTE i kö (enskild bild): behåll befintlig logik exakt som idag

```text
// Pseudokod
if (isInterior) {
  const bgImageUrl = positionEditorPhoto.backgroundImageUrl;
  const hasInteriorQueue = !!interiorImageFlowQueue;

  if (hasInteriorQueue) {
    // Don't close editor — advance immediately
    advanceInteriorImageQueue();
    
    // Fire-and-forget: save in background
    (async () => {
      try {
        await supabase.from("photos").update({ is_processing: true }).eq("id", photoId);
        // upload + DB update + track usage
        successNotification();
      } catch (error) {
        // error handling
      }
    })();
  } else {
    // Single image — keep existing logic exactly as-is
    // ... (current code unchanged)
  }
}
```

## Vad som INTE ändras
- Enskild interiörbild — exakt samma logik som idag
- AI-redigerings-flödet — orört
- CarPositionEditor — orörd
- Alla andra flöden — orörda

## Risk
Extremt låg. Samma fire-and-forget mönster som redan används för Gemini-kön. Enda skillnaden: `advanceInteriorImageQueue()` anropas FÖRE sparningen istället för efter.

