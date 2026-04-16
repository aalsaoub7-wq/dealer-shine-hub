

# Analys: "Vår AI fick för många bollar att jonglera" toast

## Sammanfattning

Toasten används som ett **generiskt felmeddelande** för minst 8 helt olika situationer i `CarDetail.tsx`. Den triggas vid alla typer av fel och timeouts, inte bara vid "för många samtidiga jobb". Det gör det omöjligt att veta vad som faktiskt gick fel.

## Alla 8 triggers (rad i CarDetail.tsx)

| # | Rad | Trigger | Verklig orsak |
|---|-----|---------|---------------|
| 1 | ~296 | `resetStuckPhotos()` — watchdog hittar foton som stått `is_processing=true` i >90s | Foto fastnade, kanske pga Edge Function som tog för lång tid eller klienten tappade kontakt |
| 2 | ~787 | `segment-car` failar eller timear ut (60s timeout) under batch-redigering | Nätverksfel, Edge Function långsam, eller timeout |
| 3 | ~1000 | `processGeminiQueue` — `add-reflection` failar eller timear ut (90s) | AI-modellen svarar långsamt eller returnerar fel |
| 4 | ~1169 | Interiör-redigering — `segment-car` eller bildkomposition failar | Samma som #2 men i interiörflödet |
| 5 | ~1310 | `handleRegenerateBackground` — regenerering av bakgrund failar | segment-car eller add-reflection failar under re-edit |
| 6 | ~1411 | `handleRegenerateReflectionConfirmed` — regenerering av reflektion failar | add-reflection failar under reflektion-regenerering |
| 7 | ~1582 | `handlePositionSave` — sparande av positionerad bild failar | Upload till storage eller add-reflection failar |
| 8 | ~1648 | `handlePositionSaveWithReflection` — samma som #7 men med reflektion | add-reflection timear ut (90s) |

## Varför kunderna ser det ofta

1. **Watchdogen (trigger #1)** körs vid varje sidladdning. Om en bild fastnade i `is_processing` vid ett tidigare besök (t.ex. webbläsaren stängdes mitt under redigering), triggas toasten nästa gång de öppnar sidan — utan att de har gjort något.

2. **60-sekunders timeout för segment-car** och **90-sekunders timeout för add-reflection** är hårda gränser. Edge function-loggarna visar inga 500-fel eller timeouts just nu, men i perioder med hög last kan det ta längre tid, och då triggas toasten.

3. **Alla catch-block** använder samma generiska toast, inklusive vid nätverksfel, storage-problem, och edge function-fel. Användaren får ingen information om vad som hände.

## Plan

### 1. Ta bort toast från watchdogen (trigger #1)
Watchdogen ska tyst nollställa `is_processing` utan att visa toast. Användaren behöver inte veta att ett gammalt jobb städades upp.

### 2. Gör felmeddelandena specifika
Ersätt det generiska meddelandet med kontextanpassade toasts:
- Segment-fel: "Bilden kunde inte bearbetas just nu. Försök igen."
- Reflektion-fel: "AI-redigeringen misslyckades. Försök igen."
- Timeout: "Det tog för lång tid. Försök igen om en stund."
- Spara-fel: "Kunde inte spara bilden. Försök igen."

### 3. Lägg till retry-logik (valfritt, låg risk)
För timeouts: höj timeout till 120s för add-reflection (Gemini kan vara långsam).

### Filer att ändra
- `src/pages/CarDetail.tsx` — alla 8 ställen med "jonglera"-toasten

### Risk
Minimal. Bara toast-strängar och watchdog-beteende ändras. Ingen logik påverkas.

