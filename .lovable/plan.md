

# Fixa PWA safe area på iPhone

## Problem
När appen öppnas som PWA (standalone) på iPhone hamnar innehållet under notchen/statusbaren. Det beror på att:

1. `index.html` har `apple-mobile-web-app-status-bar-style="black-translucent"` -- det gör statusbaren transparent och innehållet ritas under den
2. `NativeLayout` lägger bara till safe area-padding när `isNativeApp()` är true (Capacitor), men i PWA-läge returnerar den false
3. Inget i CSS:en kompenserar för safe area i PWA standalone-läge

## Lösning
Lägg till CSS som applicerar `padding-top: env(safe-area-inset-top)` i PWA standalone-läge via en media query. Detta påverkar INTE vanlig webbläsarvy.

## Ändringar -- 2 filer

### 1. `src/index.css` -- Lägg till PWA standalone safe area-stöd

Lägg till en ny CSS-regel som aktiveras ENBART i standalone-läge (PWA):

```css
/* PWA Standalone safe area - iPhone notch */
@media all and (display-mode: standalone) {
  body {
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
}
```

Denna media query matchar bara när appen körs som installerad PWA, aldrig i vanlig webbläsare.

### 2. `src/pages/Dashboard.tsx` -- Headern behöver inte ändras

Headern har redan `sticky top-0` och kommer automatiskt att respektera body-paddinget. Ingen ändring behövs här.

## Vad som INTE ändras
- `NativeLayout.tsx` -- den hanterar Capacitor-appen, inte PWA
- `index.html` -- `black-translucent` behålls (det ger snyggare PWA-upplevelse)
- `NativeRouter.tsx`
- Dashboard, Landing, eller andra sidor
- Desktop/webbupplevelsen

## Resultat
I PWA standalone-läge på iPhone skjuts innehållet ner under statusbaren/notchen automatiskt. Vanlig webbvy påverkas inte.
