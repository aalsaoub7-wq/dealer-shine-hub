

## Lagg till bakgrundsjustering i samma positionsredigerare

### Sammanfattning

I det normala (exteriora) laget kan anvandaren idag bara flytta/rotera/skala bilen. Denna andring gor att anvandaren ocksa kan valja och flytta/skala bakgrundsbilden i samma canvas-session. Klicka pa bilen = valj bilen (rod ram). Klicka pa bakgrunden = valj bakgrunden (bla ram).

### Vad som andras

**2 filer** berors — `CarPositionEditor.tsx` (logik) och `RegenerateOptionsDialog.tsx` (knapptext). Ingen annan fil andras.

---

### 1. `src/components/CarPositionEditor.tsx`

**Ny state (1 rad)**
- `selectedElement: 'car' | 'background'` — default `'car'`

**Bildladdning — initiera bakgrundsposition aven i normalt lage**
- Idag initieras `bgX`, `bgY`, `bgScale` bara nar `moveBackground` ar true
- Andring: gor samma initiering (skala till att tacka canvas, centrera) aven nar `moveBackground` ar false, sa att bakgrunden borjar pa ratt plats

**renderCanvas — normalt lage**
- Byt ut `ctx.drawImage(bgImgRef.current, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)` till att rita bakgrunden vid `bgX, bgY` med `bgScale` (precis som i moveBackground-laget)
- Om `selectedElement === 'background'`: rita bla selektionsram och bla resize-handtag runt bakgrunden
- Om `selectedElement === 'car'`: rita rod selektionsram, rod resize-handtag och gront rotationshandtag (exakt som idag)

**handleMouseDown — normalt lage**
- Om `selectedElement === 'car'`: forst kolla resize-/rotationshandtag, sedan bilens kropp. Om klick ar utanfor bilen → satt `selectedElement = 'background'`
- Om `selectedElement === 'background'`: forst kolla bakgrundens resize-handtag, sedan bakgrundens yta. Om klick ar utanfor bakgrunden → satt `selectedElement = 'car'`

**handleMouseMove — normalt lage**
- Om `selectedElement === 'background'` och `isDragging`: flytta bakgrunden (uppdatera bgX, bgY)
- Om `selectedElement === 'background'` och `isResizing`: skala bakgrunden (uppdatera bgScale)
- Om `selectedElement === 'car'`: befintlig logik for drag/resize/rotation (oforandrad)

**handleSave — normalt lage**
- Rita bakgrunden vid `bgX, bgY` med `bgScale` istallet for vid fast (0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)
- Bilritningen med rotation forblir identisk

**Rubrik**
- Byt `"Justera bilens position"` till `"Justera position"`

**Footer-text**
- Uppdatera instruktionen: "Klicka pa bilen eller bakgrunden for att valja. Dra for att flytta, dra handtaget for att andra storlek."

---

### 2. `src/components/RegenerateOptionsDialog.tsx`

- Rad 73: Byt `"Justera bilens position"` till `"Justera position"`
- Rad 74-75: Byt beskrivningen till `"Flytta och andra storlek pa bilen och bakgrunden"`
- Rad 113: Samma textandring
- Rad 114-115: Samma beskrivningsandring

---

### Vad som INTE andras

- `moveBackground`-laget (for interiora bilder med bakgrundsbild) — helt ofort
- Interior solid-color-laget — ofort
- Alla props pa `CarPositionEditor` — inga nya props
- `CarDetail.tsx` — inga andringar
- Rotationslogik — fungerar som forut nar bilen ar vald
- Touch-hantering — inga andringar (syntetiska events kanaliseras till samma handlers)

### Beteende

```text
Anvandaren oppnar "Justera position":

1. Bilen ar forvald (rod ram, kan dra/resiza/rotera)
2. Klickar pa bakgrunden → bakgrunden valjs (bla ram, kan dra/resiza)
3. Klickar pa bilen igen → bilen valjs (rod ram)
4. Klickar "Spara" → exporterar med bade bilens och bakgrundens justerade positioner
```

### Risk

**Mycket lag** — logiken for bakgrundsflyttning finns redan i `moveBackground`-laget och ateranvands. Nar `selectedElement === 'car'` (default) beter sig allt identiskt med nuvarande beteende. Bakgrundsinteraktion aktiveras bara nar anvandaren explicit klickar utanfor bilen.

