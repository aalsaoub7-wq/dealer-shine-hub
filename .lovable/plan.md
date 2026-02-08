

# PWA: Gor Luvero installerbar fran webblasaren

## Oversikt

Gor sa att besokare pa luvero.se kan "installera" appen direkt fran webblasaren (Android Chrome, Desktop Chrome/Edge, och iOS via "Lagg till pa hemskarm"). Detta ar komplementart till de befintliga Capacitor-apparna -- PWA:n ar for webbanvandare, Capacitor ar for App Store/Google Play.

## Vad som implementeras

### 1. Installera `vite-plugin-pwa`

Lagg till `vite-plugin-pwa` som dev-dependency. Denna plugin hanterar:
- Automatisk generering av `manifest.webmanifest`
- Automatisk generering av service worker (via Workbox)
- Caching-strategier for app-shell och assets
- Auto-update med prompt

### 2. Konfigurera Vite (`vite.config.ts`)

Lagg till `VitePWA()` i plugins-arrayen med:
- `registerType: 'prompt'` -- visar en "Uppdatering tillganglig"-banner istallet for att tvinga reload
- Manifest med Luvero-brandade varden:
  - `name: "Luvero - AI Bilredigering"`
  - `short_name: "Luvero"`
  - `start_url: "/"`
  - `display: "standalone"`
  - `theme_color: "#0a0a0f"`
  - `background_color: "#0a0a0f"`
  - Icons: 192x192, 512x512, 512x512 maskable
- Workbox runtime caching:
  - `CacheFirst` for statiska assets (bilder, JS, CSS)
  - `NetworkFirst` for API-anrop (forhindrar cachning av auth/data)
  - Navigations-fallback till `index.html` (SPA-stod)

### 3. Skapa PWA-ikoner

Skapa `public/icons/` mapp med:
- `icon-192.png` (192x192) -- baserat pa befintlig favicon.png
- `icon-512.png` (512x512) -- baserat pa befintlig favicon.png
- `icon-512-maskable.png` (512x512 med padding for maskable) -- baserat pa befintlig favicon.png

Initialt anvands den befintliga favicon-designen (rod/vit L-logotyp). Ikonerna kan bytas ut senare.

### 4. Uppdatera `index.html`

Lagg till i `<head>`:
```html
<meta name="theme-color" content="#0a0a0f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

Manifest-lanken lags till automatiskt av `vite-plugin-pwa`.

### 5. Registrera Service Worker (`src/main.tsx`)

Anvand `registerSW` fran `virtual:pwa-register` med `isNativeApp()`-guard:
- Om `isNativeApp()` ar `true`: skippa SW-registrering (Capacitor hanterar sin egen caching)
- Om web: registrera SW och lyssna pa uppdateringar

### 6. Skapa `PWAInstallPrompt`-komponent

En liten, icke-patvingande komponent som:
- Lyssnar pa `beforeinstallprompt`-eventet (Chrome/Edge/Android)
- Visar en "Installera appen"-knapp NAR install ar tillgangligt
- Pa klick: anropar `prompt()` och doljer knappen om installerad/avvisad
- Detekterar iOS Safari och visar istallet en hint: "Pa iPhone: Dela -> Lagg till pa hemskarm"
- Visar en "Uppdatering tillganglig - Ladda om"-banner nar en ny service worker ar redo

### 7. Lagg till `PWAInstallPrompt` i Landing-sidan

Placera komponenten diskret i Landing-sidans header (bredvid "Logga in"-knappen) eller som en liten floating banner langst ner.

---

## Tekniska andringar

| Fil | Andring |
|-----|---------|
| `package.json` | Lagg till `vite-plugin-pwa` som devDependency |
| `vite.config.ts` | Lagg till `VitePWA()` plugin med manifest och workbox-konfiguration |
| `index.html` | Lagg till `theme-color`, Apple PWA-meta-taggar, `apple-touch-icon` |
| `src/main.tsx` | Lagg till SW-registrering med Capacitor-guard |
| `public/icons/icon-192.png` | Ny ikon (192x192) |
| `public/icons/icon-512.png` | Ny ikon (512x512) |
| `public/icons/icon-512-maskable.png` | Ny maskable ikon (512x512) |
| `src/components/PWAInstallPrompt.tsx` | Ny komponent for install-prompt och update-banner |
| `src/pages/Landing.tsx` | Importera och rendera `PWAInstallPrompt` |

## Vad som INTE andras

- Capacitor-konfigurationen (capacitor.config.ts) -- inga andringar
- NativeLayout/NativeRouter -- inga andringar
- Auth-flodet -- service workern anvander `NetworkFirst` for API-anrop
- Befintliga routes och komponenter -- inga andringar
- Databasschema -- inga andringar

## Capacitor-kompatibilitet

Service workern registreras INTE nar appen kors inuti Capacitor (kontrolleras via `isNativeApp()`). Detta forhindrar konflikter med Capacitors egen webview-hantering. PWA-funktionaliteten ar exklusiv for webblasaren.

## Begransningar i Lovable-miljon

- Service workers kraver HTTPS for att fungera. Pa Lovable preview (https://*.lovable.app) och den publicerade domanen (luvero.se) fungerar detta.
- I lokal utveckling (localhost) fungerar service workers aven utan HTTPS.

