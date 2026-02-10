
# Större expand- och rotate-handtag på PWA

## Problem
Resize- och rotate-handtagen i CarPositionEditor ritas på canvas med storlek `isMobile ? 60 : 40` pixlar. På iPhone PWA är 60px fortfarande för litet för att träffa med fingret.

## Ändring — 1 fil, 1 värde

### `src/components/CarPositionEditor.tsx`

Ändra alla förekomster av:
```
const handleSize = isMobile ? 60 : 40;
```
Till:
```
const handleSize = isMobile ? 80 : 40;
```

Detta påverkar ca 5 ställen i filen — alla definierar samma `handleSize`-variabel. Desktop-värdet (40) ändras inte.

## Vad som INTE ändras
- Desktop-upplevelsen (fortfarande 40px)
- Ingen ny logik, inga nya filer
- Canvas-ritning och touch-hantering fungerar identiskt, bara träffytan och den visuella storleken ökar
