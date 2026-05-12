## Mål
Få Gemini Test-tabben att bara använda bildmodeller, så svaret blir bild och inte text/JSON.

## Ändring

### 1. `src/components/admin/GeminiPlayground.tsx`
- Begränsa modell-dropdownen till endast dessa bildmodeller:
  - `google/gemini-2.5-flash-image`
  - `google/gemini-3-pro-image-preview`
  - `google/gemini-3.1-flash-image-preview`
- Byt default från `google/gemini-3-flash-preview` till `google/gemini-3.1-flash-image-preview`.
- Lägg en kort hjälptext under dropdownen som förklarar att denna tab bara använder bildmodeller.

### 2. `supabase/functions/gemini-playground/index.ts`
- Byt fallback/default-modell från textmodellen `google/gemini-3-flash-preview` till `google/gemini-3.1-flash-image-preview`.
- Lägg en minimal allowlist-validering för just den här funktionen så att text-only modeller inte accepteras här.
- Behåll övrig logik exakt som nu: samma auth-kontroll, samma requestflöde, samma bildextraktion, inga andra sidoflöden.

## Varför detta är low risk
- Endast Gemini Test-tabben och dess egen backendfunktion rörs.
- Inga andra admin-tabbar, bildredigeringsflöden, billingflöden, syncflöden eller databasanrop påverkas.
- Sökning i koden visar att `gemini-playground` bara används av `GeminiPlayground` i `/admin`.

## Teknisk effekt
- Frontend kan inte längre råka skicka bildprompts till en textmodell.
- Backend har ett skydd om gammal klientkod eller felaktig payload ändå skickar fel modell.
- Funktionen fortsätter returnera samma format: `{ text, images, raw }`, så ingen bredare integration ändras.

## Validering efter implementation
- `/admin` → Gemini Test laddar utan fel.
- Dropdown visar bara 3 bildmodeller.
- Default är `google/gemini-3.1-flash-image-preview`.
- Ett test med prompt + bild skickar en bildmodell i request body.
- Svaret visar bild i UI i stället för text/JSON.
- Ingen annan route eller tab behöver ändras eller påverkas.