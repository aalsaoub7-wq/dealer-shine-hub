

# Fix bildförhållande i bildväljaren vid synk (3:2 istället för 16:9)

## Problem

Bilderna i bildväljaren (för Blocket, Wayke och övrig synk) använder `aspect-video` (16:9) vilket gör att de ser för inzoomade ut. De ska ha 3:2-förhållande, precis som på bilens detaljsida.

## Ändring

**Fil:** `src/components/PlatformSyncDialog.tsx`

Byt `aspect-video` till `aspect-[3/2]` på **två** ställen i `renderImagePicker`-funktionen:

1. **Rad 339** (bildens `<img>`-tagg): `aspect-video` -> `aspect-[3/2]`
2. **Rad 347** (placeholder/skeleton vid laddning): `aspect-video` -> `aspect-[3/2]`

## Vad ändras INTE

- Inga andra filer eller komponenter
- Ingen backend-logik, edge functions eller databasändringar
- Ingen ändring av CarDetail, galleriet eller någon annan sida
