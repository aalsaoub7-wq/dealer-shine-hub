

# Fixa 3 PWA-problem på iPhone

## Problem 1: Inställningsdialogen respekterar inte safe area
Inställningsdialogen (`AiSettingsDialog.tsx`) renderas som en `fixed`-positionerad dialog via Radix UI. Den använder `max-h-[calc(100vh-2rem)]` som inte tar hänsyn till safe area insets i PWA standalone-läge. Innehållet kan hamna under notchen.

## Problem 2: Hover-effekter triggas vid scroll på touch
I `PhotoGalleryDraggable.tsx` använder bildkorten CSS-klassen `group-hover:opacity-100` för att visa knappar (radera, maximera, redigera) samt `group-hover:scale-110` på bilden och `group-hover:opacity-20` för en gradient-overlay. På iOS tolkas touch-scroll som hover, vilket gör att allt man scrollar förbi "highlightas".

## Problem 3: Kan inte scrolla i inställningar
Inställningsdialogen har `max-h-[90vh] overflow-y-auto` i sin className, men `DialogContent`-komponenten har `max-h-[calc(100vh-2rem)]` som bas. Problemet kan vara att iOS PWA standalone-läge inte beräknar `vh` korrekt med safe area, eller att `overflow-y-auto` inte fungerar som förväntat i den fixerade dialogen på iOS. Lösningen är att använda `dvh` (dynamic viewport height) som fungerar bättre på iOS.

## Ändringar -- 3 minimala, isolerade fixar

### 1. `src/index.css` -- Safe area för fixerade dialoger i PWA-läge
Lägg till i den befintliga `@media all and (display-mode: standalone)`-blocket:

```css
@media all and (display-mode: standalone) {
  body {
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  /* Dialogs: respect safe area */
  [data-radix-portal] [role="dialog"] {
    max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2rem);
    margin-top: env(safe-area-inset-top, 0px);
  }
}
```

### 2. `src/components/PhotoGalleryDraggable.tsx` -- Byt hover till active för touch
Ersätt `group-hover` med `group-hover` som enbart aktiveras med `@media (hover: hover)` genom att lägga till en CSS-klass, ELLER den enklaste lösningen: använd Tailwinds inbyggda `@media (hover: hover)` via att byta `group-hover:` till `md:group-hover:` (som i praktiken exkluderar touch-enheter).

Ändra rad 81 (Card className):
- `hover:shadow-intense hover:-translate-y-2` till `md:hover:shadow-intense md:hover:-translate-y-2`

Ändra rad 89 (checkbox opacity):
- `group-hover:opacity-100` till `md:group-hover:opacity-100`

Ändra rad 110 (bild scale):
- `group-hover:scale-110` till `md:group-hover:scale-110`

Ändra rad 126 (gradient overlay):
- `group-hover:opacity-20` till `md:group-hover:opacity-20`

Ändra rad 144 (action buttons):
- `group-hover:opacity-100` till `md:group-hover:opacity-100`

### 3. `src/components/AiSettingsDialog.tsx` -- Fixar scroll i inställningar
Ändra rad 750 `DialogContent` className:
- `max-h-[90vh]` till `max-h-[85dvh]`

`dvh` (dynamic viewport height) fungerar korrekt i iOS standalone PWA-läge, och 85dvh ger utrymme för safe area.

## Vad som INTE ändras
- Inga nya filer
- Inga ändringar i desktop/webbupplevelsen (hover fungerar som innan på desktop)
- Ingen ändring av NativeLayout, NativeRouter eller Capacitor-logik
- Inga ändringar av funktionalitet eller dataflöde
- Inga beroenden läggs till
