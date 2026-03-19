

# Lägg till "Överför till dokumentation/huvudfoton"-knapp

## Vad som ändras

**Enda fil:** `src/pages/CarDetail.tsx`

## Ändring

Lägg till en knapp direkt bredvid "Markera alla"-knappen (runt rad 1963) som bara syns när bilder är markerade. Knappen:

- I fliken "main": visar **"Överför till dokumentation (N)"** och uppdaterar `photo_type` till `"documentation"` för valda bilder
- I fliken "docs": visar **"Överför till huvudfoton (N)"** och uppdaterar `photo_type` till `"main"` för valda bilder

**Logik vid klick:**
1. Kör `supabase.from("car_photos").update({ photo_type: targetType }).in("id", selectedIds)`
2. Uppdatera lokalt `photos`-state genom att ändra `photo_type` på berörda bilder
3. Rensa markeringen (`setSelectedMainPhotos([])` / `setSelectedDocPhotos([])`)

**Ikon:** Lägg till `ArrowRightLeft` från lucide-react (import). Styling identisk med "Markera alla"-knappen (`variant="outline"`, samma klasser).

## Risk
Ingen. Rent additivt — en ny knapp som bara syns vid markering. Använder befintlig supabase-klient och state-hantering.

