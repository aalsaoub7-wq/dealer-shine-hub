

# Lägg till registreringsskylts-val vid regenerering och positionsjustering

## Översikt
Visa samma "Behåll reg skylt / Ta bort reg skylt"-dialog innan Gemini anropas vid:
1. "Generera ny skugga och reflektion"
2. "Justera position" -> Spara (för studio-bilder)

## Ändringar -- EN fil: `src/pages/CarDetail.tsx`

### 1. Ny state för att fånga väntande regenerering/position-save
Lägg till state som mellanlagrar vilken åtgärd som väntar:
```
const [pendingPlateAction, setPendingPlateAction] = useState<
  { type: "regenerate", photoId: string } |
  { type: "positionSave", compositionBlob: Blob } |
  null
>(null);
```

### 2. `handleRegenerateReflection` -- avbryt och visa dialog
Istället för att direkt anropa add-reflection, spara photoId och öppna plate-dialogen:
```
setPendingPlateAction({ type: "regenerate", photoId });
setPlateChoiceOpen(true);
```
Flytta den faktiska logiken till en ny funktion `executeRegenerateReflection(photoId, removePlate)`.

### 3. `handlePositionEditorSave` -- avbryt och visa dialog (bara studio)
För studio-bilder (icke-interior), innan add-reflection anropas, spara blob och öppna dialogen:
```
setPendingPlateAction({ type: "positionSave", compositionBlob });
setPlateChoiceOpen(true);
```
Flytta studio-delen av logiken till `executePositionSave(compositionBlob, removePlate)`.

Interior-bilder (som inte skickas till Gemini) berörs INTE.

### 4. Uppdatera plate-dialogen callback
Utöka den befintliga `onChoice`-callbacken så den hanterar alla tre scenarion:
- `pendingEditPhotos` (befintlig -- initial redigering)
- `pendingPlateAction.type === "regenerate"`
- `pendingPlateAction.type === "positionSave"`

### 5. Skicka `remove_plate` i FormData
I de två nya execute-funktionerna, lägg till:
```
reflectionFormData.append("remove_plate", removePlate ? "true" : "false");
```
Edge-funktionen hanterar redan denna parameter -- ingen backend-ändring behövs.

## Vad som INTE ändras
- Edge-funktionen `add-reflection` (redan stöder `remove_plate`)
- `LicensePlateChoiceDialog`-komponenten (samma UI)
- All annan logik: timeouts, watchdog, billing, segment-car, compositing
- Interior-flödet (skickas aldrig till Gemini)

