## Problem 1: Bekräftelsedialog vid radering av bild

Idag tas en bild bort direkt när man klickar på papperskorgen — ingen ångerväg. Vi lägger till en bekräftelsedialog med `AlertDialog` (shadcn) i båda gallerikomponenterna.

**Filer:**
- `src/components/PhotoGalleryDraggable.tsx` — huvudgalleriet på bilsidan
- `src/components/PhotoGallery.tsx` — enklare gallerivy

**Ändring:**
- Lägg till state `photoToDelete: string | null`.
- Radera-knappens `onClick` sätter `photoToDelete` istället för att radera direkt.
- Rendera en `AlertDialog` med:
  - Titel: "Radera bild?"
  - Beskrivning: "Bilden tas bort permanent och kan inte återställas."
  - Avbryt-knapp + destruktiv "Radera"-knapp som kör befintlig `handleDelete`.
- Ingen ändring i databaslogik eller övriga flöden.

## Problem 2: Arkiverade bilar dyker inte upp i sökning

Idag filtrerar Dashboard så här (rad 178–190):
- Om sökrutan innehåller ordet **"arkiv"** → visa bara arkiverade bilar.
- Annars → visa bara icke-arkiverade.

Det betyder att en sökning på t.ex. regnr eller modell aldrig hittar en arkiverad bil — användaren måste först veta att man ska skriva "arkiv".

**Ny logik i `src/pages/Dashboard.tsx`:**
- Standardvyn (tom sökruta) visar fortfarande bara aktiva bilar (oförändrat).
- Så fort användaren skriver något i sökfältet → sök i **både** aktiva och arkiverade bilar.
- "arkiv"-genvägen behålls: skriver man bara "arkiv" visas alla arkiverade.
- Arkiverade träffar visas tillsammans med aktiva. Befintlig markering av arkiverade kort (om sådan finns i `CarCard`/`CarCardListItem`) räcker för att skilja dem åt — ingen ny UI införs i denna ändring.

**Teknisk skiss:**
```ts
const query = searchQuery.toLowerCase().replace("arkiv", "").trim();
const isArchiveOnly = searchQuery.toLowerCase().includes("arkiv");

const baseCars = !searchQuery
  ? cars.filter(c => c.deleted_at === null)        // tom sökning → bara aktiva
  : isArchiveOnly && !query
    ? cars.filter(c => c.deleted_at !== null)      // bara "arkiv" → bara arkiverade
    : cars;                                        // sökning → båda

const filteredCars = baseCars.filter(/* befintlig match-logik */);
```

Inga DB- eller backend-ändringar. Ingen påverkan på upload-, edit- eller billingflöden.