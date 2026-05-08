## Problem

I `PlatformSyncDialog.tsx` (image picker, rad 381) renderas `<img src={photo.url}>` — original­bilden i full kvalitet (ofta flera MB per bild). I en grid med många bilar betyder det stor onödig nedladdning bara för thumbnails.

## Lösning

Använd den **befintliga** helpern `getOptimizedImageUrl` från `src/lib/imageOptimization.ts` som redan används i `CarCard`, `PhotoGalleryDraggable`, `LandingPagePreview`, `ImageLightbox` m.fl. Den konverterar Supabase Storage-URL:er till `/storage/v1/render/image/public/...` med width/quality-parametrar (Supabase egen on-the-fly transform — ingen ny edge function behövs).

## Ändring (1 fil, 2 rader)

**`src/components/PlatformSyncDialog.tsx`**

1. Lägg till import högst upp:
   ```ts
   import { getOptimizedImageUrl } from "@/lib/imageOptimization";
   ```

2. Rad 382 — byt `src={photo.url}` mot:
   ```tsx
   src={getOptimizedImageUrl(photo.url, { width: 400, quality: 60 })}
   ```

`width: 400` täcker grid-cols-2 thumbnails med marginal för retina. `quality: 60` matchar liknande thumbnail-användning i appen (CarCard använder default 75 men för en större tile).

## Konsekvenser och säkerhetscheck

- **Helpern är defensiv**: returnerar original-URL oförändrad om den inte är en Supabase Storage public-URL. Externa URL:er, blob:, data: påverkas inte.
- **`onLoad`-callbacken** använder `photo.url` som key i `loadedImages`-Set:et. Detta påverkas **inte** — vi byter bara `src`-attributet, inte värdet som skickas till `handleImageLoad(photo.url)` eller `loadedImages.has(photo.url)`. Skeleton-fade fungerar oförändrat.
- **Selection-state** (`selectedImagesList.includes(photo.url)`, `toggleImage(photo.url)`): orört — använder fortfarande original-URL. Det som skickas vidare till sync/share är original­bilden i full kvalitet, vilket är rätt beteende (Blocket/social media ska ha högkvalitet).
- **Inga andra filer rörs.** Inget annat flöde påverkas.

## Validering efter ändring

1. Öppna PlatformSyncDialog → bilder ska visa sig identiskt men nätverkstrafiken per bild minskar dramatiskt (DevTools Network → bildstorlek från MB till ~30-80 KB).
2. Markera en bild → checkmark visas (selection orört).
3. Trigga faktisk sync/share → den skickade URL:en är fortfarande original (full kvalitet).
4. Skeleton-pulsen försvinner när bilden laddats (onLoad fungerar).
