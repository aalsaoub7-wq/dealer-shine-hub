# Capacitor Native App Improvements

Detta dokument beskriver alla förbättringar som gjorts för att optimera Luvero native app med Capacitor plugins.

## Installerade Plugins

### 1. @capacitor/camera
Native kameraåtkomst för fotouppladdning.

**Funktionalitet:**
- Ta foto direkt med kameran
- Välj från galleri
- Bättre HEIC/HEIF-hantering på iOS
- Snabbare och smidigare än HTML file input

**Användning:**
- Öppna "Ladda upp foton" dialog
- Välj mellan "Ta foto" eller "Välj från galleri"
- Fungerar automatiskt bara i native app

### 2. @capacitor/haptics
Taktil feedback vid interaktioner.

**Funktionalitet:**
- Light impact för lätta interaktioner (knapptryck, val)
- Medium impact för standardinteraktioner
- Heavy impact för viktiga åtgärder
- Success/Warning/Error notifications för resultat

**Användning:**
- Automatisk feedback vid:
  - Fotouppladding (camera/gallery val)
  - AI-redigering
  - Delning
  - Dashboard refresh

### 3. @capacitor/share
Native delning via enhetens delningsmeny.

**Funktionalitet:**
- Öppnar enhetens native share sheet
- Delar text och länkar
- Fallback till Web Share API på web
- Ytterligare fallback till clipboard

**Användning:**
- Dela bilder från CarDetail
- Systemet försöker native share först
- Kopierar till urklipp om native share inte finns

### 4. @capacitor/splash-screen
Kontrollerad splash screen vid appstart.

**Funktionalitet:**
- Visar splash screen vid start
- Döljs automatiskt efter 500ms när app är redo
- Svart bakgrund (#0a0a0f) som matchar app-temat

**Konfiguration:**
- 2 sekunders visning som standard
- Fullscreen och immersive på Android
- Ingen spinner

### 5. @capacitor/keyboard
Förbättrad tangentbordshantering.

**Funktionalitet:**
- Native keyboard resize-beteende
- Dark style som matchar app-temat
- Accessory bar för iOS
- Resize på fullscreen

**Funktioner:**
- `hideKeyboard()` - Dölj tangentbordet programmatiskt
- `showKeyboard()` - Visa tangentbordet programmatiskt

### 6. @capacitor/app
App-lifecycle och back-button hantering.

**Funktionalitet:**
- Android back-button beteende
  - Stänger app om ingen historik finns
  - Annars navigerar bakåt
- App state change listeners (active/background)
- Deep linking support (URL open)

**Automatisk:**
- Konfigureras automatiskt i App.tsx
- Städas upp vid unmount

### 7. @capacitor/network
Nätverksstatus monitoring.

**Funktionalitet:**
- Realtidsövervakning av nätverksstatus
- Visar "Ingen internetanslutning" banner när offline
- Fallback till Web API (navigator.onLine) på web

**Användning:**
- Dashboard visar automatiskt offline-indikator
- Kan användas för att förhindra API-anrop när offline

## Nya Hooks

### useNativeCamera
```typescript
const { takePhoto, pickFromGallery, isCapturing } = useNativeCamera({
  onPhotoCaptured: (file) => {
    // Hantera filen
  }
});
```

### useHaptics
```typescript
const { 
  lightImpact, 
  mediumImpact, 
  heavyImpact,
  successNotification,
  warningNotification,
  errorNotification 
} = useHaptics();
```

### useNetworkStatus
```typescript
const { isOnline, connectionType } = useNetworkStatus();
```

## Nya Utilities (lib/nativeCapabilities.ts)

### nativeShare
```typescript
const shared = await nativeShare(title, text, url);
// returns true if shared successfully
```

### hideKeyboard / showKeyboard
```typescript
await hideKeyboard();
await showKeyboard();
```

### hideSplashScreen
```typescript
await hideSplashScreen();
```

### setupAppListeners / removeAppListeners
```typescript
setupAppListeners(); // Körs automatiskt i App.tsx
removeAppListeners(); // Körs automatiskt vid cleanup
```

## UX-förbättringar

### PhotoUpload
- Native kamera-knappar på mobil
- Web file input på desktop
- Taktil feedback vid val
- Validering av filer

### CarDetail
- Native share för delning
- Taktil feedback vid AI-redigering
- Success notification vid delning

### Dashboard
- Offline-indikator
- Refresh-indikator
- Nätverksstatus-medvetenhet
- Taktil feedback vid refresh

### App-nivå
- Splash screen hantering
- Back-button beteende på Android
- Deep linking support
- Keyboard konfiguration

## Web vs Native

Alla native-funktioner är villkorliga och påverkar INTE web-versionen:

```typescript
if (isNativeApp()) {
  // Native-specifik kod
}
```

Web-versionen fortsätter fungera exakt som tidigare med:
- HTML file input för fotouppladdning
- Web Share API eller clipboard för delning
- Standard web-beteende för navigation

## Nästa steg för deployment

1. **Git pull projektet** från din GitHub
2. **Installera dependencies**: `npm install`
3. **Lägg till platforms**:
   - iOS: `npx cap add ios`
   - Android: `npx cap add android`
4. **Uppdatera platforms**: `npx cap update ios` / `npx cap update android`
5. **Bygg projektet**: `npm run build`
6. **Synka Capacitor**: `npx cap sync`
7. **Kör på device/emulator**:
   - iOS: `npx cap run ios` (kräver Mac + Xcode)
   - Android: `npx cap run android` (kräver Android Studio)

## Plugin-konfiguration

All plugin-konfiguration finns i `capacitor.config.ts`:

- **SplashScreen**: Svart bakgrund, 2s visning, fullscreen
- **Keyboard**: Native resize, dark style, accessory bar
- **StatusBar**: Dark style, svart bakgrund
- **Android**: Mixed content tillåtet
- **iOS**: Automatic content inset, scrolling disabled

## Troubleshooting

### Kamera fungerar inte
- Kontrollera permissions i iOS Info.plist / Android manifest
- Kör `npx cap sync` efter uppdateringar

### Haptics fungerar inte
- Fungerar bara på fysiska enheter, inte emulatorer
- iOS kräver haptic-kapabel device

### Share fungerar inte
- Fallback till Web Share API eller clipboard
- Kontrollera att URL är valid

### Splash screen visas inte
- Kontrollera att assets finns i native projects
- Kör `npx cap sync` efter asset-ändringar
