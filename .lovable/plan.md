

# Uppdatera Användarvillkor

## Vad som ändras

Hela innehållet i `src/pages/TermsOfService.tsx` ersätts med den nya texten. Strukturen (18 sektioner istället för 15), rubriker och innehåll byts ut helt enligt den tillhandahållna texten.

## Tekniska detaljer

### Fil: `src/pages/TermsOfService.tsx`

- Behåller: imports, navigate, SEOHead, container, back-button, styling-klasser
- Ersätter: Allt innehåll i `<div className="prose ...">` med de 18 nya sektionerna
- Datumet hårdkodas till "2026-03-18" istället för `new Date().toLocaleDateString()`
- Titeln ändras till "Användarvillkor för Luvero"
- Bullet-listor i sektion 2, 3, 6, 7, 9, 14, 17 renderas med `<ul className="list-disc">`
- Sektion 5 och 7 innehåller löpande text med specifika belopp och procentsatser
- Ingen annan fil ändras

## Risk
Ingen. Rent innehållsbyte i en statisk sida.

