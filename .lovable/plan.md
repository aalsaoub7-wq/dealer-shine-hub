## Ändring

Flikknapparna (Huvudfoton, Dokumentation, Skadebilder) ska fylla hela bredden på mobil. Desktop förblir oförändrat.

### Tekniska detaljer

**`src/components/ui/tabs.tsx`** — TabsList:
- Ändra `inline-flex` till `flex` på mobil, behåll `md:inline-flex` för desktop.

Alternativt (och enklare): Sätt `w-full` på TabsList + `flex-1` på TabsTrigger bara på mobil. Knapparna har redan `flex-1 sm:flex-none` i CarDetail, och TabsList har redan `w-full sm:w-auto` där. Problemet är att TabsList-komponenten använder `inline-flex` som förhindrar att den fyller bredden trots `w-full`.

**Ändring i `src/components/ui/tabs.tsx` (rad 15):**
- `inline-flex` → `flex md:inline-flex`

Bara en rad ändras. Desktop är oförändrat tack vare `md:inline-flex`.
