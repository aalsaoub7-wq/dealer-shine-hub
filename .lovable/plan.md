

# PWA: Starta direkt på /dashboard

## Oversikt

Gor sa att nar anvandaren oppnar den installerade PWA:n (via hemskarms-ikonen) landar de direkt pa `/dashboard` istallet for landningssidan `/`.

Om anvandaren inte ar inloggad hanterar den befintliga `ProtectedRoute`-komponenten redirect till `/auth` automatiskt.

## Andringar

### 1. Andra `start_url` i manifestet (`vite.config.ts`)

Andra `start_url` fran `"/"` till `"/dashboard"` i PWA-manifestets konfiguration. Detta ar den URL som oppnas nar anvandaren klickar pa den installerade PWA-ikonen.

### 2. Lagg till PWA standalone-redirect i `NativeRouter.tsx`

Utoka den befintliga redirect-logiken (som idag bara kor for Capacitor) sa att den aven galler for PWA i standalone-lage:

- Detektera standalone-lage via `window.matchMedia('(display-mode: standalone)')` eller `navigator.standalone` (iOS)
- Om appen kors i standalone OCH anvandaren ar pa `/`: redirecta till `/dashboard` (ProtectedRoute skickar vidare till `/auth` om ej inloggad)

Detta gor att aven om anvandaren navigerar till `/` inifran PWA:n sa skickas de vidare till dashboard.

### Filer som andras

| Fil | Andring |
|-----|---------|
| `vite.config.ts` | Andra `start_url` fran `"/"` till `"/dashboard"` |
| `src/components/NativeRouter.tsx` | Lagg till standalone-detektering sa PWA ocksa redirectas fran `/` till `/dashboard` |

### Vad som INTE andras

- Landningssidan (`Landing.tsx`) -- forblir tillganglig pa `/` for vanliga webbanvandare
- `ProtectedRoute` -- ingen andring, hanterar redan redirect till `/auth` for ej inloggade
- Service worker / caching -- ingen andring
- Databas -- ingen andring

