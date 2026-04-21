

# Smoothare BeforeAfterSlider + snabbare logo-marquee på mobil

Två minimala ändringar, helt isolerade. Inga andra komponenter eller logik påverkas.

## 1. `src/components/BeforeAfterSlider.tsx` — fixa janken efter flera drags

**Rotorsak:** När man drar fram och tillbaka snabbt startas/stoppas auto-animationen (`isAnimating`) flera gånger via inactivity-timern. Animations-`useEffect` läser `sliderPosition` som startvärde via closure — men eftersom effekten har `[isAnimating]` som dependency, blir `position` ibland stale och RAF "hoppar" från fel utgångsläge → ser hackigt ut. Dessutom rensas inte `inactivityTimerRef` på unmount.

**Minimala fixar (inga API-ändringar, inga nya beroenden):**

- Använd en `positionRef` som alltid speglar aktuell `sliderPosition`. Auto-animationens RAF läser och skriver mot ref istället för closure-variabeln, så att den alltid startar från där användaren släppte slidern.
- I drag-handlers (`handleMouseDown`/`handleTouchStart`): `cancelAnimationFrame(animationRef.current)` direkt när drag startar, istället för att vänta på att `useEffect`-cleanup kör vid nästa render. Det eliminerar den korta perioden där två RAF-loopar kan överlappa.
- Lägg till cleanup av `inactivityTimerRef` i unmount-effekten (förhindrar att en timer triggar `setIsAnimating(true)` efter att komponenten är borta — orsakar React-warning + ibland en sista jank-frame).
- Behåll allt annat (RAF-throttling i `handleMove`, bounds-cache, transition-classes) oförändrat.

## 2. `src/components/LogoMarquee.tsx` — snabbare scroll endast på mobil

**Nuvarande:** `animate-marquee` använder Tailwind-klassen som kör `40s linear infinite` på alla viewports.

**Fix:** Lägg till en inline `style={{ animationDuration: ... }}` på den scrollande track-diven, baserad på `useIsMobile()`-hooken (finns redan i `src/hooks/use-mobile.tsx`). Mobil får t.ex. `20s`, desktop behåller `40s` (Tailwind-defaulten).

Endast en hook-import + en style-prop — ingen Tailwind-config-ändring, ingen ny CSS-klass, desktop-beteendet är garanterat oförändrat.

## Filer som ändras

- `src/components/BeforeAfterSlider.tsx` — `positionRef` + cancel-i-drag + timer-cleanup
- `src/components/LogoMarquee.tsx` — `useIsMobile()` + `animationDuration` inline style

## Risk

Mycket låg. Båda filerna är isolerade UI-komponenter på landningssidan. Inga props, ingen state utåt, ingen backend.

