

# Fix inzoomade bilder i synk-bildväljaren

## Problem

Bilderna i synk-bildväljaren ser inzoomade och dåliga ut. Orsaken är att `getOptimizedImageUrl` skalar ner bilderna till 300px bredd med `resize=cover` på serversidan, vilket beskär och försämrar bilderna. På bildetaljsidan används **originalbilderna utan optimering**.

## Ändring

**Fil:** `src/components/PlatformSyncDialog.tsx` (rad 325 och 339)

1. **Ta bort `getOptimizedImageUrl`-anropet** -- använd `photo.url` direkt, precis som på bildetaljsidan
2. **Byt `aspect-[3/2]` tillbaka till `aspect-video`** -- bildetaljsidan använder `aspect-video`
3. Behåll `object-cover`, `loading="lazy"` och `decoding="async"` (samma som detaljsidan)

Konkret:
- Rad 325: ta bort `const optimizedUrl = ...` eller byt till `photo.url`
- Rad 337: `src={photo.url}` istället för `src={optimizedUrl}`
- Rad 339: `aspect-video` istället för `aspect-[3/2]`
- Rad 347: `aspect-video` istället för `aspect-[3/2]`

## Vad ändras INTE

- Inga andra filer eller komponenter
- Ingen backend, edge functions eller databas
- CarDetail, galleriet och allt annat förblir orört

