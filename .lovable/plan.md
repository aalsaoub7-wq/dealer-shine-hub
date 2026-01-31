

## Plan: Fixa fastnade bilder och förhindra framtida problem

### Omedelbar åtgärd

Joels Bil har 5 bilder som har fastnat i "bearbetningsläge" i över 9 timmar. Dessa måste återställas omedelbart.

### Problem 1: Bilder fastnar om användaren stänger webbläsaren

Nuvarande flöde:
1. Användaren klickar "Redigera"
2. `is_processing = true` sätts i databasen
3. Asynkron bakgrundsbearbetning startar (segment → composite → reflection)
4. Om användaren stänger fliken mitt i - bearbetningen avbryts utan att `is_processing` återställs

### Problem 2: Ingen tidsgräns på API-anrop

Om `segment-car`, `compositeCarOnBackground` eller `add-reflection` hänger sig, finns ingen timeout. Bilden fastnar för alltid.

---

## Lösning: Tre delar

### Del 1: Återställ fastnade bilder nu (SQL)

Kör följande för att omedelbart låsa upp Joels Bils fastnade bilder:

```sql
UPDATE photos 
SET is_processing = false
WHERE is_processing = true 
AND updated_at < NOW() - INTERVAL '30 minutes';
```

### Del 2: Automatisk återhämtning vid sidladdning

Lägg till logik i `CarDetail.tsx` som automatiskt återställer bilder som varit "processing" i mer än 10 minuter när sidan laddas.

**Fil: `src/pages/CarDetail.tsx`**

Ny funktion efter `fetchCarData`:

```typescript
const resetStuckPhotos = async () => {
  // Reset photos stuck in processing for more than 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  
  const { error } = await supabase
    .from("photos")
    .update({ is_processing: false })
    .eq("car_id", id)
    .eq("is_processing", true)
    .lt("updated_at", tenMinutesAgo);
    
  if (error) {
    console.error("Error resetting stuck photos:", error);
  }
};
```

Anropa i `useEffect`:
```typescript
useEffect(() => {
  if (id) {
    fetchCarData();
    resetStuckPhotos(); // <-- Lägg till denna
    checkPaymentMethod();
    // ...
  }
}, [id]);
```

### Del 3: Timeout på bearbetningen

Lägg till timeout-wrapper för API-anropen för att undvika att de hänger sig för länge.

**Fil: `src/pages/CarDetail.tsx`**

Ny hjälpfunktion:

```typescript
const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(errorMessage)), ms)
  );
  return Promise.race([promise, timeout]);
};
```

Använd i `handleEditPhotos`:

```typescript
// Istället för:
const { data: segmentData, error: segmentError } = await supabase.functions.invoke("segment-car", { body: segmentFormData });

// Använd:
const { data: segmentData, error: segmentError } = await withTimeout(
  supabase.functions.invoke("segment-car", { body: segmentFormData }),
  60000, // 60 sekunder timeout
  "Segmentering tog för lång tid, försök igen"
);
```

---

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/pages/CarDetail.tsx` | Lägg till `resetStuckPhotos()` och `withTimeout()` |

## Teknisk sammanfattning

```text
┌─────────────────────────────────────────────────────────────┐
│  NUVARANDE FLÖDE (PROBLEM)                                  │
├─────────────────────────────────────────────────────────────┤
│  1. Klick "Redigera" → is_processing = true                 │
│  2. Asynk bearbetning startar                               │
│  3. Användare stänger fliken                                │
│  4. is_processing = true FÖR ALLTID                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  NYTT FLÖDE (LÖSNING)                                       │
├─────────────────────────────────────────────────────────────┤
│  1. Klick "Redigera" → is_processing = true                 │
│  2. Asynk bearbetning startar MED TIMEOUT                   │
│  3. Om timeout → error handler → is_processing = false      │
│  4. Vid sidladdning: auto-reset bilder stuck > 10 min       │
└─────────────────────────────────────────────────────────────┘
```

