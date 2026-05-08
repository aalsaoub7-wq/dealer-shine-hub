## Problem

När jag bytte till `getOptimizedImageUrl` ser bilderna ut att zoomas in. Orsaken är **inte** transformations-URL:en — det är `object-cover` + `aspect-video` på `<img>`-taggen i picker:n som beskär bilden till 16:9 (samma uppsättning som main grid använder, men där råkar bilderna passa bättre).

Användaren vill se **hela bilden** i picker:n, bara i lägre kvalitet.

## Lösning

Två minimala justeringar i `PlatformSyncDialog.tsx` rad 384 och placeholder rad 392:

1. Byt `object-cover` → `object-contain` på `<img>` så hela bilden visas (letterbox vid behov, ingen beskärning).
2. Lägg till `bg-muted` på `<img>`-containern så letterbox-områdena får en neutral bakgrund (snyggare än transparent).

Transform-URL:en förblir oförändrad (`width: 400, quality: 60`) — Supabase behåller bildens egna proportioner när bara `width` skickas, så servern beskär inte heller.

## Ändring (1 fil, 2 rader)

**`src/components/PlatformSyncDialog.tsx`** rad 384:
```tsx
className={`aspect-video w-full rounded-lg bg-muted object-contain transition-opacity duration-300 ${
```

(byter `object-cover` → `bg-muted object-contain`)

## Konsekvenser

- **Inga andra flöden påverkas.** Endast två klassnamn på en `<img>`-tagg i picker:n.
- Main grid (`PhotoGalleryDraggable`, `CarCard`) orörd — den använder fortfarande `object-cover` som tidigare.
- Selection, sync, share, onLoad — allt orört.
- Bilderna laddas fortfarande som ~400px-thumbnails (snabb laddning).

## Validering

1. Öppna PlatformSyncDialog → bilderna visas i sin helhet (inte zoomade), eventuella svarta/grå kanter på sidorna.
2. Network tab → fortfarande små filer (~30-80 KB).
3. Markera/avmarkera bilder → fungerar.
