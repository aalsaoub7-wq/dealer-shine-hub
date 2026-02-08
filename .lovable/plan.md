

# Visa PWA-installknappen och uppdatera "Finns dar appar finns"-kortet

## Problem

PWA-installknappen syns inte for att den bara renderas nar webblasaren stodjer `beforeinstallprompt` (Chrome/Android) eller nar anvandaren ar pa iOS Safari. I alla andra fall returnerar komponenten `null` och inget visas. Det innebar att knappen ar osynlig i de flesta weblasare tills man faktiskt kan installera -- men du vill att den alltid ska vara synlig.

## Andringar

### 1. PWAInstallButton.tsx -- Visa alltid en knapp

Andra komponenten sa att den alltid renderar nagot, aven nar `canInstall` ar `false`:

- **Om `canInstall` ar true**: Visa "Installera appen"-knapp som triggar install-prompten (som idag)
- **Om `isIOS` ar true**: Visa iOS-hinten "Dela -> Lagg till pa hemskarm" (som idag)
- **Fallback (ny)**: Visa en vanlig lank/knapp med texten "Installera appen" som scrollar till instruktioner, eller visar en tooltip/info om att man oppnar sidan i Chrome for att installera. Enklaste losningen: alltid visa knappen -- om `canInstall` ar false oppnas sidan i Chrome som en hint.

For **button-varianten**: Visa alltid en "Installera online"-knapp. Om `canInstall` ar true triggas prompten. Om inte visas en liten info-text om att oppna i Chrome.

For **link-varianten**: Visa alltid "Installera appen"-lanken i footern. Samma logik.

### 2. Landing.tsx -- Uppdatera feature-kortet (rad 347-357)

- **Ta bort** de tva App Store/Google Play badge-bilderna (rad 348-351)
- **Andra rubriken** fran "Finns dar appar finns" till nagonting som "Installera online" eller liknande
- **Ta bort** "Beta (Kommer Snart)"-badgen
- **Andra beskrivningstexten** fran "Luvero finns pa bade Play Store, App Store och Online!" till nagot i stil med "Installera Luvero direkt fran din webblasare -- ingen app store behovs."
- **Behall** `<PWAInstallButton variant="button" />`

### 3. Landing.tsx -- Footern (rad 899)

Ingen strukturandring -- `<PWAInstallButton variant="link" />` ar redan pa plats. Den kommer att synas tack vare andring 1.

## Filer som andras

| Fil | Andring |
|-----|---------|
| `src/components/PWAInstallButton.tsx` | Lagg till fallback-rendering sa knappen alltid visas |
| `src/pages/Landing.tsx` | Ta bort App Store/Google Play badges, uppdatera rubrik och text i feature-kortet |

## Vad som INTE andras

- PWA-konfiguration (vite.config.ts) -- ingen andring
- Service worker -- ingen andring
- usePWAInstall hook -- ingen andring
- Ovriga komponenter och sidor -- ingen andring
- Databas -- ingen andring

