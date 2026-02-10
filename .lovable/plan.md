
# Fixa checkbox-synlighet och safe area i positionsredigeraren

## Problem 1: Checkbox syns inte på iPhone PWA
Checkboxen på bildkorten (rad 89) har `opacity-0 md:group-hover:opacity-100` — samma problem som action-knapparna hade. På mobil triggas aldrig `md:group-hover`, så checkboxen förblir osynlig (förutom när den redan är ikryssad).

## Problem 2: Positionsredigeraren (CarPositionEditor) respekterar inte safe area
Redigeraren använder `fixed inset-0` (rad 774) som täcker hela skärmen. I PWA standalone-läge på iPhone hamnar headern under notchen och footern (med Spara-knappen) under home-indikatorn.

## Ändringar — 2 filer, minimala och isolerade

### 1. `src/components/PhotoGalleryDraggable.tsx` — Gör checkbox synlig på mobil

Rad 89, ändra opacity-klassen:

Från:
```
isSelected ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'
```
Till:
```
isSelected ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
```

Samma mönster som action-knapparna redan använder (rad 144). Checkboxen syns alltid på mobil, hover-beteende på desktop.

### 2. `src/index.css` — Safe area för fullskärms-editorer i PWA-läge

Lägg till i det befintliga `@media all and (display-mode: standalone)`-blocket:

```css
/* Full-screen editors (position editor etc): respect safe area */
.fixed.inset-0 {
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

Detta gör att alla `fixed inset-0`-element (som CarPositionEditor och WatermarkPositionEditor) automatiskt får safe area-padding i PWA standalone-läge. Påverkar inte desktop eller vanlig webbläsare.

## Vad som INTE ändras
- Inga nya filer
- Ingen ändring av desktop-upplevelsen
- Ingen ändring av funktionalitet eller dataflöde
- CarPositionEditor-logiken rörs inte — enbart CSS-fix
- Inga beroenden
