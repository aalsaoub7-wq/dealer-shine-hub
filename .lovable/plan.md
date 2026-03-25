

# Ta bort gratis omgenerering — varje redigering/justering = full bild

## Vad som ändras

Två minimala ändringar:

### 1. `src/lib/usageTracking.ts` — `trackRegenerationUsage` (~rad 217–263)

Hela funktionen förenklas: ta bort free regeneration-logiken. Funktionen ska ALLTID kalla `trackUsage("edited_image", carId)` oavsett `has_free_regeneration`-flaggan. Joels Bil-undantaget tas också bort (de betalade redan för allt).

Ny funktion:
```typescript
export const trackRegenerationUsage = async (photoId: string, carId: string) => {
  await trackUsage("edited_image", carId);
};
```

### 2. `src/pages/CarDetail.tsx` — ta bort `has_free_regeneration: true` vid sparning

Två ställen sätter `has_free_regeneration: true` i DB-uppdateringar:
- ~rad 868 (edit flow / Gemini-kön)
- ~rad 1031 (interiör solid color)

Ändra båda till `has_free_regeneration: false` (eller ta bort raden).

## Vad som INTE ändras
- `photos`-tabellens schema — kolumnen finns kvar, bara sätts aldrig till true
- Stripe-rapportering — orört (varje `trackUsage` skapar billing event + rapporterar)
- Alla andra flöden — orörda
- Edge functions — orörda
- Reconcile-logiken — orört

## Varför detta räcker
Alla ställen som trackar regenerering/justering anropar redan `trackRegenerationUsage`. Den funktionen var den enda som kunde "skippa" billing. När den alltid kallar `trackUsage` blir varje redigering/justering en fakturerad bild.

## Risk
Extremt låg. En funktion förenklas, två DB-uppdateringar ändrar ett default-värde. Inga nya kodstigar.

