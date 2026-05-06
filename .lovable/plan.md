## UI-förbättring: Knappfält på bildetaljsidan

### Problem
Alla knappar (åtgärdsknappar + markera + ladda upp) ligger i en platt `flex-wrap` som blir rörig, särskilt på mobil. Ingen visuell separation mellan "alltid synliga" knappar och "selection-baserade" åtgärder.

### Lösning
Dela upp knappfältet i **två visuellt separerade rader**:

**Rad 1 (åtgärdsrad)** — Visas bara när bilder är markerade:
- Dela, Ladda ned, Interiör, AI redigera, Vattenmärke, Överför
- Kompakt med `size="sm"` och `variant="outline"` med shadcn-stil (inga custom border-color klasser)
- Wrappas i en diskret container med `bg-muted/50 rounded-lg p-2`

**Rad 2 (fast rad)** — Alltid synlig:
- Vänster: Markera alla / Avmarkera alla (`variant="ghost"`, `size="sm"`)
- Höger: Ladda upp-knappen (behåller befintlig gradient-stil)

### Teknisk detalj

**Fil:** `src/pages/CarDetail.tsx`, raderna ~2210–2360

Ändringarna är rent visuella:
- Wrappar åtgärdsknappar i en egen `div` med bakgrund
- Separerar Markera + Ladda upp i en egen `div` med `flex justify-between`
- Använder `size="sm"` på alla knappar för renare look
- Tar bort överflödiga custom CSS-klasser (border-primary, border-blue-500, border-accent) och använder shadcn-varianter (`variant="outline"`, `variant="secondary"`) istället
- Behåller all onClick-logik, conditional rendering och funktionalitet exakt som den är

**Ingen backend-ändring. Ingen logikändring. Bara layout och styling.**