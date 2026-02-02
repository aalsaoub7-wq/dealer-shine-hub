
## Fix: Checkbox-storlek på Desktop

### Problem
Checkboxen i `PhotoGalleryDraggable.tsx` har **egna storleksklasser** som skriver över komponentens standardstorlek:
- `className="... h-12 w-12 md:h-6 md:w-6"`

Detta gör att:
1. På desktop blir checkbox-rutan 24px (`md:h-6 md:w-6`)
2. Men ikonen i checkbox.tsx försöker vara 40px (`md:h-10 md:w-10`)
3. = Ikonen "spiller över" rutan → ser "jätteskumt" ut

### Lösning
Ta bort storleks-override i `PhotoGalleryDraggable.tsx` så att checkboxen använder komponentens standardstorlek (som nu är `md:h-16 md:w-16` på desktop).

### Ändring

**Fil: `src/components/PhotoGalleryDraggable.tsx`** (rad 94)

Från:
```tsx
<Checkbox ... className="bg-background/80 border-2 h-12 w-12 md:h-6 md:w-6" />
```

Till:
```tsx
<Checkbox ... className="bg-background/80 border-2" />
```

### Resultat
- Mobil: 48px (`h-12 w-12`) - oförändrad
- Desktop: 64px (`md:h-16 md:w-16`) - dubbelt så stor som tidigare `md:h-6`
- Ikon skalas korrekt med rutan
