

## Lagg till rotation i bilpositionsredigeraren

### Vad som andras

**1 fil: `src/components/CarPositionEditor.tsx`** — inga andra filer berors.

### Hur det fungerar

En ny roteringshandtag (gron cirkel) placeras i mitten av bilens overkant. Nar anvandaren drar i den, roteras bilen runt sitt centrum.

```text
         [Rotationshandtag]
              (gron)
    +---------------------------+
    |                           |
    |         BILEN             |
    |                           |
    +---------------------------+
                          (Storlekshandtag)
                              (rod)
```

### Andringar i detalj

Alla andringar ar **additivt** — befintlig logik for drag, resize och moveBackground rors inte.

**Ny state (2 rader)**
- `carRotation` (number, default 0) — rotationsvinkel i radianer
- `isRotating` (boolean, default false) — om anvandaren drar roteringshandtaget

**renderCanvas — rotation vid ritning**
- Innan bilen ritas: `ctx.save()`, `ctx.translate(centerX, centerY)`, `ctx.rotate(carRotation)`, rita bilen offset fran centrum, `ctx.restore()`
- Rita ett gront roteringshandtag vid bilens ovrekant (roterat med bilen)
- Befintlig selektionsram och resize-handtag ritas ocksa roterade

**handleMouseDown — detektera roteringshandtaget**
- Berakna roteringshandtagets position (topp-center, roterat)
- Om klick ar nara handtaget: satt `isRotating = true`
- All befintlig logik for drag/resize forblir oforandrad

**handleMouseMove — berakna vinkel**
- Om `isRotating`: berakna vinkeln fran bilens centrum till muspekaren med `Math.atan2`
- Subtrahera 90 grader (for att nollpunkten ar uppat)
- All befintlig logik for drag/resize forblir oforandrad

**handleMouseUp — nollstall**
- Lagg till `setIsRotating(false)` bredvid befintliga `setIsDragging(false)` och `setIsResizing(false)`

**handleSave — applicera rotation vid export**
- Samma `save/translate/rotate/restore`-logik som i renderCanvas
- Ingen selektionsram ritas (precis som idag)

**Footer-text**
- Uppdatera instruktionen: lagg till "dra den grona pricken for att rotera"

### Vad som INTE andras

- Inget i moveBackground-laget (rotation galler bara bilen i normalt lage)
- Inga andra komponenter eller filer
- Ingen andring i props-granssnitt (CarPositionEditorProps)
- Ingen andring i hur CarPositionEditor anropas fran CarDetail
- Drag, resize, touch-hantering — allt befintligt beter sig identiskt

### Risk

**Mycket lag** — alla andringar ar additivt inuti en enda komponent. Om `carRotation` forblir 0 (default), beter sig allt exakt som fore andringen. Rotation aktiveras bara om anvandaren explicit drar i det nya handtaget.

