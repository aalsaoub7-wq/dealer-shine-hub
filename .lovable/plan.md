## Problem
Tabellen `photos` har en CHECK-constraint `photos_photo_type_check` som endast tillåter `'main'` och `'documentation'`. När man laddar upp skadebilder skickar appen `photo_type = 'damage'`, vilket databasen avvisar.

## Lösning
En enda DB-migration som uppdaterar constraint till att även tillåta `'damage'`:

```sql
ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_photo_type_check;
ALTER TABLE public.photos ADD CONSTRAINT photos_photo_type_check
  CHECK (photo_type IN ('main', 'documentation', 'damage'));
```

Inga kodändringar behövs — appen använder redan `'damage'` överallt (CarDetail.tsx, PhotoUpload.tsx).

## Validering
Ladda upp en bild i "Skadebilder"-fliken — uppladdningen ska gå igenom utan felet `photos_photo_type_check`.

## Utanför scope
Inga ändringar i UI, RLS, edge functions eller övrig logik.