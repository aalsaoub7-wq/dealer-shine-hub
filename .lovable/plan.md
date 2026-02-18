

# Fix: Concurrency-kö + 10-minuters timeout for bildbehandling

## Problem

Nar en anvandare valjer t.ex. 8 bilder att redigera skickas alla 16 API-anrop samtidigt, vilket overvaldigar Gemini/Remove.bg och orsakar timeouts och "for manga bollar att jonglera"-felmeddelanden.

## Losning -- 1 fil, 2 forEach-loopar byts ut

**Fil:** `src/pages/CarDetail.tsx`

### Andringar

#### 1. `handleEditPhotos` (rad 612-715)

Byt `photosToProcess.forEach(...)` mot en ko som processar max 2 bilder at gangen. Varje worker "touchar" fotots `updated_at` precis innan den borjar (sa att watchdogens 90s-klokka nollstalls). Lagg aven till en 10-minuters sakerhetstimeout per foto i kon -- om en bild inte blivit klar inom 10 minuter aterstalls den.

**Befintlig kod som INTE andras:**
- Rad 604-609 (markerar alla foton som `is_processing: true` direkt) -- behalls exakt som idag
- All processningslogik per foto (segment, composite, reflection, update) -- identisk
- Error handling och toast -- identisk

**Vad som andras:** Bara forEach-loopen (rad 612-715) ersatts med:

```typescript
const MAX_CONCURRENT = 2;
const queue = [...photosToProcess];
const QUEUE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const processNext = async () => {
  const photo = queue.shift();
  if (!photo) return;

  // Safety timeout: if this photo hasn't completed in 10 min, reset it
  const safetyTimer = setTimeout(async () => {
    console.error(`Photo ${photo.id} timed out after 10 minutes`);
    await supabase
      .from("photos")
      .update({ is_processing: false })
      .eq("id", photo.id);
  }, QUEUE_TIMEOUT_MS);

  // Touch updated_at to reset watchdog timer
  await supabase
    .from("photos")
    .update({ is_processing: true })
    .eq("id", photo.id);

  try {
    // ... exakt samma processningslogik som idag (rad 616-699) ...
    clearTimeout(safetyTimer);
  } catch (error) {
    clearTimeout(safetyTimer);
    // ... exakt samma error handling som idag (rad 700-712) ...
  }

  await processNext();
};

const workers = Array.from(
  { length: Math.min(MAX_CONCURRENT, queue.length) },
  () => processNext()
);
Promise.all(workers);
```

#### 2. `handleInteriorEdit` (rad 771-861)

Exakt samma monster appliceras pa interiorredigeringens forEach-loop. Samma MAX_CONCURRENT = 2, samma touch-trick, samma 10-minuters timeout.

**Befintlig kod som INTE andras:**
- Rad 762-768 (markerar alla foton som `is_processing: true` direkt)
- All processningslogik per foto (segment, composite, upload)
- Error handling och toast

### Tidslinje med 8 bilder (ca 45s/bild)

```text
Tid    Bild 1-2                    Bild 3-8
0s     Touched + processas         is_processing=true sedan 0s (UI: "Bild Behandlas")
45s    KLARA, bild 3-4 touched     Watchdog ser updated_at < 45s -- ingen reset
90s    Bild 3-4 KLARA, 5-6 touched Watchdog ser updated_at < 0s -- ingen reset
135s   Bild 5-6 KLARA, 7-8 touched
180s   Alla KLARA
```

Vid 90s: watchdogen kollar bild 5-8, men de alla har `updated_at` fran 0s (markerades vid start). Bild 5-6 touchas vid 90s sa deras updated_at nollstalls. Bild 7-8 ar dock fortfarande vid 0s = 90s gammalt -- **precis pa gransen**. Darfor ar touch-mekanismen viktig: den sker precis innan processning startar, sa att watchdogen aldrig hinner trigga.

### 10-minuters timeout

Om nagonting gar snett (t.ex. en worker kraschar tyst utan att na catch-blocket), nollstalls fotot automatiskt efter 10 minuter. Timern rensas (`clearTimeout`) sa fort processningen lyckas eller failar normalt, sa den triggas bara vid riktigt ovanliga scenarier.

## Vad som INTE andras

- Inga edge functions
- Ingen databas/schema
- Ingen watchdog-logik (`resetStuckPhotos` forblir oforandrad)
- Ingen ny state-variabel
- Ingen UI-andring (alla bilder visar "Bild Behandlas" direkt, precis som idag)
- Stanga flik / navigera bort fungerar exakt som idag
- Toast-meddelanden, error handling, usage tracking -- allt oforandrat
- Bara **1 fil** rors, bara **2 forEach-loopar** byts ut
