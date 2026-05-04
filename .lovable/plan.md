## Problem
Bilder kan dras utanför galleriets synliga område — de fortsätter följa muspekaren bortom containern.

## Lösning
Använda `@dnd-kit/modifiers`-paketet med `restrictToParentElement` som begränsar drag-operationer till galleriets `div`-container.

### Ändringar

1. **Installera `@dnd-kit/modifiers`** — npm-paket som redan är kompatibelt med befintlig `@dnd-kit/core`.

2. **`src/components/PhotoGalleryDraggable.tsx`** — Importera `restrictToParentElement` och lägg till `modifiers={[restrictToParentElement]}` på `<DndContext>`. En rad import, en rad prop. Inget annat ändras.

### Påverkan
- Minimal ändring: 2 rader.
- Ingen påverkan på andra flöden (upload, delete, edit, watermark, lightbox, billing).
