

# Lägg till "Markera alla / Avmarkera alla"-knapp

## Vad som ändras

**Enda fil:** `src/pages/CarDetail.tsx`

**Enda ändring:** Lägg till en knapp direkt före "Ladda upp"-knappen (rad 1928) som togglear markering av alla bilder i den aktiva fliken.

## Logik

- Om `activeTab === "main"`:
  - Om `selectedMainPhotos.length > 0` → knappen visar "Avmarkera alla" och kör `setSelectedMainPhotos([])`
  - Annars → knappen visar "Markera alla" och kör `setSelectedMainPhotos(mainPhotos.map(p => p.id))`
- Om `activeTab === "docs"`:
  - Om `selectedDocPhotos.length > 0` → knappen visar "Avmarkera alla" och kör `setSelectedDocPhotos([])`
  - Annars → knappen visar "Markera alla" och kör `setSelectedDocPhotos(docPhotos.map(p => p.id))`

## Teknisk detalj

En `Button variant="outline"` med `CheckSquare`/`Square` ikon placeras direkt före upload-knappen (rad 1928). Ingen import behöver läggas till om `CheckSquare` och `Square` inte redan finns — kan använda `Check` som redan importeras, eller lägga till en lucide-ikon. Styling matchar befintliga knappar i raden.

Ingen annan fil, funktion eller logik ändras.

## Risk
Ingen. Rent additivt — en ny knapp med setState-anrop som redan används överallt.

