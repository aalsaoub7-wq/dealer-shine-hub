

## Fix ikoner pa resize- och rotationshandtag

### Problemet

Bade det roda resize-handtaget (nere till hoger) och det grona rotationshandtaget (uppe i mitten) ritar exakt samma ikon — en cirkular pil-arc. Det gor att de ser identiska ut och ar forvirrande.

### Losning

**1 fil: `src/components/CarPositionEditor.tsx`** — bara ikonritningen i resize-handtaget andras.

**Resize-handtaget (rod cirkel, rad 361-377):**
Byt ut den cirkulara pilen till en diagonal dubbelriktad pil (↔ diagonalt), som ar standard for "andra storlek". Tva pilar som pekar utifran varandra diagonalt (nere-vanster till uppe-hoger).

**Rotationshandtaget (gron cirkel, rad 404-417):**
Ingen andring — den cirkulara pilen ar ratt ikon for rotation.

### Vad som andras (exakt)

- Rad 361-377: Byt ikonen fran cirkular arc till diagonal resize-pilar
- Inget annat i filen rors — ingen logik, inga koordinater, inga fargval

### Risk

**Ingen** — bara canvas-ritkommandon for ikonen inuti den roda cirkeln andras. All interaktionslogik, positionering och exportering ar identisk.

