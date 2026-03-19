

# Ta bort success-toast vid överföring

## Ändring

**Enda fil:** `src/pages/CarDetail.tsx`, rad 1981

Ta bort raden `toast({ title: "Klart", description: \`${selectedIds.length} bild(er) överförda.\` });`

Behåll error-toasten (rad 1976) — den är viktig. Bara success-toasten tas bort.

## Risk
Ingen. Tar bort en enda rad.

