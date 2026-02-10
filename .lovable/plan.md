
# Fixa PWA-uppdatering: byt till automatisk uppdatering

## Problem
I `main.tsx` rad 19-20 anropas `registerSW({ immediate: true })` som updateSW-funktion. Detta registrerar en NY service worker istället for att aktivera den som väntar. Därför händer inget vid klick på "Uppdatera".

## Lösning
Byt `registerType` från `"prompt"` till `"autoUpdate"` i vite.config.ts. Då aktiveras nya versioner automatiskt i bakgrunden -- ingen banner behövs, ingen klick-interaktion.

## Ändringar -- 2 filer

### 1. `vite.config.ts` (rad 17)
Ändra:
```
registerType: "prompt",
```
Till:
```
registerType: "autoUpdate",
```

### 2. `src/main.tsx` (rad 12-29)
Förenkla service worker-registreringen. Ta bort `onNeedRefresh` och det custom event, behåll bara:
```typescript
if (!isNativeApp()) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      onOfflineReady() {
        console.log("Luvero PWA: Ready for offline use");
      },
    });
  });
}
```

## Vad som INTE ändras
- `PWAInstallPrompt.tsx` -- update-bannern visas aldrig mer (showUpdateBanner forblir false), men komponenten behöver inte tas bort
- `usePWAInstall.ts` -- SW-update-lyssnaren triggas aldrig, men ingen skada
- Workbox-config, manifest, ikoner, caching-strategi
- All annan logik i appen

## Resultat
PWA:n uppdateras automatiskt i bakgrunden. Nästa gång användaren laddar om sidan eller öppnar appen får de den senaste versionen utan att behöva klicka på något.
