
# Inaktivera lightbox vid klick på bild på mobil

## Översikt
På mobil ska man inte kunna öppna lightbox genom att klicka på själva bilden. Lightbox ska bara öppnas via expand-knappen (Maximize2-ikonen). På desktop behålls beteendet som det är.

## Ändring -- EN fil: `src/components/PhotoGalleryDraggable.tsx`

### Rad 99: Villkora `onClick` baserat på skärmstorlek
Importera `useIsMobile` och använd den för att villkora klicket:

**Lägg till import:**
```typescript
import { useIsMobile } from "@/hooks/use-mobile";
```

**I `SortablePhotoCard`-komponenten, lägg till:**
```typescript
const isMobile = useIsMobile();
```

**Rad 99 -- ändra från:**
```typescript
onClick={() => onImageClick(photo.url)}
```

**Till:**
```typescript
onClick={() => !isMobile && onImageClick(photo.url)}
```

## Vad som INTE ändras
- Expand-knappen (Maximize2) på rad 149 -- den fungerar alltid, mobil och desktop
- ImageLightbox-komponenten
- SharedPhotos-sidan
- Desktop-beteendet
- All annan logik
