

# PWA-installknapp i "Finns dar appar finns"-sektionen och footern

## Vad som andras

Just nu ar PWA-installprompten en flytande banner langst ner pa skarmen. Du vill istallet ha synliga installknappar pa tva platser:

1. **"Finns dar appar finns"-kortet** (feature 6) -- lagg till en "Installera online"-knapp bredvid App Store/Google Play-badgarna
2. **Footern** -- lagg till en installera-lank i en av kolumnerna

## Tekniska andringar

### 1. Refaktorera `PWAInstallPrompt.tsx`

Bryt ut PWA-logiken till en **hook** (`usePWAInstall`) som returnerar:
- `canInstall` -- om `beforeinstallprompt` har avfyrats
- `isIOS` -- om anvandaren ar pa iOS Safari
- `handleInstall` -- funktion for att visa install-prompten
- `showUpdateBanner` / `handleUpdate` -- for uppdateringsbannern

Behall den flytande uppdateringsbannern som en separat komponent, men ta bort den flytande installprompten (den ersatts av de inbyggda knapparna).

### 2. Skapa `PWAInstallButton.tsx`

En enkel knappkomponent som anvander `usePWAInstall`-hooken:
- Pa Chrome/Android: visar en "Installera online"-knapp med `Download`-ikon
- Pa iOS: visar en hint-text ("Dela -> Lagg till pa hemskarm")
- Nar PWA inte stods eller redan installerad: doljs helt

### 3. Uppdatera "Finns dar appar finns"-kortet (Landing.tsx rad 346-355)

Lagg till `PWAInstallButton` under de befintliga App Store/Google Play-badgarna:

```text
[App Store badge] [Google Play badge]
[Installera online-knapp]    <-- NY
```

### 4. Uppdatera footern (Landing.tsx rad 890-898)

Lagg till en "Installera appen"-lank i "Hjalp & Juridiskt"-kolumnen (eller skapa en ny rad under footern):

```text
Hjalp & Juridiskt
- Guide for appen
- Integritetspolicy
- Anvandarvillkor
- Installera appen    <-- NY (visas bara om PWA ar tillganglig)
```

### Filer som andras

| Fil | Andring |
|-----|---------|
| `src/components/PWAInstallPrompt.tsx` | Bryt ut logik till `usePWAInstall` hook, behall uppdateringsbanner |
| `src/components/PWAInstallButton.tsx` | Ny komponent -- inline installknapp |
| `src/pages/Landing.tsx` | Lagg till `PWAInstallButton` i feature-kortet och footern |

### Vad som INTE andras

- Vite/PWA-konfiguration -- ingen andring
- Service worker-registrering -- ingen andring
- Ovriga komponenter och sidor -- ingen andring
- Databas -- ingen andring

