

# Lägg till val för registreringsskylt vid AI-redigering

## Översikt
När användaren klickar "AI redigera" visas en enkel dialog med två knappar: "Behåll reg plåt" och "Ta bort reg plåt". Val 1 fungerar exakt som idag. Val 2 lägger till en mening i Gemini-prompten.

## Ändringar (3 filer, minimala)

### 1. Ny komponent: `src/components/LicensePlateChoiceDialog.tsx`
En enkel dialog med två knappar:
- "Behåll registreringsskylt" -- anropar callback med `false`
- "Ta bort registreringsskylt" -- anropar callback med `true`

### 2. `src/pages/CarDetail.tsx` -- 3 små ändringar

**a) State och dialog**
Lägg till state för att visa dialogen och lagra vilka foton/typ som valts:
```
const [plateChoiceOpen, setPlateChoiceOpen] = useState(false);
const [pendingEditPhotos, setPendingEditPhotos] = useState<{ids: string[], type: "main"|"documentation"} | null>(null);
```

**b) Klick-hantering**
Istället för att direkt anropa `handleEditPhotos` vid knapptrycket, öppna dialogen och spara foton:
```
onClick={() => {
  setPendingEditPhotos({ ids: selectedMainPhotos, type: "main" });
  setPlateChoiceOpen(true);
}}
```

**c) Callback från dialogen**
När användaren väljer, anropa `handleEditPhotos` med en ny parameter `removePlate`:
```
handleEditPhotos(pendingEditPhotos.ids, pendingEditPhotos.type, removePlate)
```

**d) `handleEditPhotos` -- signatur och FormData**
Lägg till parameter `removePlate: boolean = false`. I FormData som skickas till `add-reflection`, lägg till:
```
reflectionFormData.append("remove_plate", removePlate ? "true" : "false");
```

### 3. `supabase/functions/add-reflection/index.ts` -- 2 rader

**a) Läs parametern:**
```
const removePlate = formData.get("remove_plate") === "true";
```

**b) Lägg till mening i prompten villkorligt:**
```
const plateInstruction = removePlate
  ? " Also remove or obscure the text/numbers on the license plate so it is not readable, but keep the plate itself intact."
  : "";
```
Sedan interpolera `plateInstruction` i den befintliga prompt-strängen.

## Vad som INTE ändras
- All befintlig logik, timeouts, watchdog, databas, segment-car, compositing
- Prompten vid val "Behåll reg plåt" är 100% identisk med nuvarande
- Inga nya beroenden, inga databasändringar
