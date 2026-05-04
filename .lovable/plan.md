
# Grid/List-vy toggle på Dashboard

## Vad som ändras

Två filer berörs, inga andra flöden påverkas:

### 1. `src/pages/Dashboard.tsx`
- Lägg till ett `viewMode` state (`"grid" | "list"`) med default `"grid"`.
- Lägg till en toggle-knapp (två ikoner: `LayoutGrid` / `List` från lucide-react) bredvid sökfältet.
- I grid-läge: exakt samma rendering som idag (ingen ändring).
- I list-läge: rendera `<CarCardListItem>` istället i en `flex flex-col gap-2` layout.

### 2. `src/components/CarCardListItem.tsx` (ny fil)
- En ny komponent som tar samma props som `CarCard`.
- Renderar en rad med:
  - Thumbnail (car.photo_url) till vänster, liten (48-56px), rundade hörn.
  - Registreringsskylt-bild med reg-nummer i mitten.
  - Bilnamn (`make model`) till höger.
- Klick navigerar till `/car/${car.id}` (samma som CarCard).
- Responsiv: på mobil stackas elementen snyggt, på desktop en ren rad.

### Vad som INTE ändras
- `CarCard.tsx` — orörd, grid-läge identiskt som förut.
- Alla andra flöden (upload, AI edit, sync, billing, auth) — ingen beröring.
- Inga nya dependencies, inga databasändringar, inga edge function-ändringar.
