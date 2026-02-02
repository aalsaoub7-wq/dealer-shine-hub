
## Lightbox Navigation med Pilar

### Vad ska göras
Lägga till vänster/höger-pilar i lightboxen så att du kan bläddra mellan bilder utan att stänga dialogen.

### Ändringar

**1. `ImageLightbox.tsx`** - Uppdatera props och lägg till navigation

Nya props:
- `images: string[]` - Lista med alla bild-URLer
- `currentIndex: number` - Index för aktuell bild
- `onNavigate: (index: number) => void` - Callback för att byta bild

Ändringar:
- Lägg till `ChevronLeft` och `ChevronRight` knappar på sidorna
- Visa endast pilar om det finns fler bilder att navigera till
- Lägg till tangentbordsstöd för piltangenter (vänster/höger)

**2. `PhotoGalleryDraggable.tsx`** - Skicka bildlista till lightbox

Ändringar:
- Byt från `lightboxUrl: string` till `lightboxIndex: number`
- Skicka `images`, `currentIndex` och `onNavigate` till `ImageLightbox`

---

### Teknisk implementation

```text
┌─────────────────────────────────────────┐
│            ImageLightbox                │
│  ┌───┐                          ┌───┐   │
│  │ < │      [Bild visas]        │ > │   │
│  └───┘                          └───┘   │
│         ← Piltangenter fungerar →       │
└─────────────────────────────────────────┘
```

**ImageLightbox.tsx** - Uppdaterade props:
```tsx
interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}
```

**PhotoGalleryDraggable.tsx** - State-ändring:
```tsx
// Före:
const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

// Efter:
const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
```

### Risk
- **Låg risk** - Ändringar är isolerade till lightbox-komponenten
- Inga ändringar i drag-and-drop eller foto-hantering
- Befintlig funktionalitet (stäng, ladda ner) bevaras
