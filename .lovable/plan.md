

## Fix: Share-preview funktionen är inte deployad

### Problemet
Edge-funktionen `share-preview` finns i koden men har aldrig deployats korrekt (den fick ett timeout-fel vid första försöket). Resultatet: delningslänken leder till en felsida istället för att visa en förhandsvisning och sedan skicka vidare till den riktiga sidan.

### Lösningen
Enkel fix -- inga kodändringar behövs. Funktionen finns redan skriven och ser korrekt ut.

1. **Deploya `share-preview` edge-funktionen** -- tvinga en ny deploy av den befintliga koden
2. **Verifiera att den svarar korrekt** -- testa med ett anrop för att bekräfta att den returnerar HTML (inte 404)
3. **Testa delningsflödet** -- dela bilder från en bil och bekräfta att länken fungerar

### Vad som ändras
- Ingenting i koden -- bara en deploy av det som redan finns

### Risk
Ingen risk alls -- koden finns redan, den behöver bara deployas.
