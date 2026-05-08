## Problem

I bildväljaren i `PlatformSyncDialog` visas porträttbilder som en smal vertikal remsa eftersom containern är `aspect-video` (16:9) och `<img>` använder `object-contain` – bilden brevlådas istället för att fylla rutan.

## Fix (minimal, isolerad)

Låt Supabase Image Transformations göra croppningen serverside istället för CSS, exakt som tänkt. Endast bildväljaren i `PlatformSyncDialog.tsx` ändras.

**`src/components/PlatformSyncDialog.tsx`** (rad 383 + 385)

- Skicka både `width` OCH `height` till `getOptimizedImageUrl` så Supabase returnerar en redan beskuren 16:9-thumbnail:
  ```ts
  src={getOptimizedImageUrl(photo.url, { width: 400, height: 225, quality: 60, resize: 'cover' })}
  ```
  (`resize: 'cover'` är redan default i `imageOptimization.ts` men jag är explicit.)
- Byt tillbaka CSS från `object-contain` → `object-cover` så att den serverbeskurna 16:9-bilden fyller rutan utan ny förvrängning.

## Vad som INTE ändras

- `src/lib/imageOptimization.ts` – orörd, fungerar redan korrekt.
- Original-URL (`photo.url`) används fortfarande för `selectedImagesList`, sync, share, `loadedImages`-Set och `onLoad` – inga andra flöden påverkas.
- Huvudgalleriet (`PhotoGalleryDraggable`, `CarCard`) – orört.
- Endast Supabase Storage-URLer transformeras (guard finns i `imageOptimization.ts`); externa URLer går rakt igenom oförändrade.

## Validering

- Verifiera att markering, sync till Bytbil/Blocket och share-funktionerna fortfarande får original-URL.
- Verifiera i preview att bildväljaren visar fyllda 16:9-thumbnails utan zoom eller letterboxing.
