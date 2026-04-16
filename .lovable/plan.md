
Mål: fastställa vad som faktiskt går fel och fixa det med minsta möjliga risk.

Det jag vet efter genomgången:
- Detta ser inte ut som en enkel grid/CSS-bugg. Din screenshot visar att flera olika foto-platser har fått samma färdigredigerade bilbild.
- Jag hittar ingen tydlig storage-krock i backend:
  - `segment-car` sparar transparent PNG per `photoId` (`transparent-{photoId}.png`)
  - `add-reflection` sparar slutbild per `photoId` + timestamp
- Grid-korten använder `key={photo.id}`, så detta är inte den klassiska React-felet med fel keys.

Exakt vad som är trasigt i koden:
1. `src/components/CarPositionEditor.tsx`
- Editorn återanvänder `bgImgRef.current` och `carCanvasRef.current` mellan olika bilder.
- När en ny bild öppnas nollställs inte dessa refs innan nya assets laddas.
- `checkBothLoaded()` sätter `imagesLoaded=true` så fort båda refs är truthy, men de kan fortfarande innehålla föregående bild.
- Det betyder att nästa editor-session kan börja rendera/spara med gamla canvas-assets.

2. `src/components/CarPositionEditor.tsx`
- `handleSave()` verifierar inte att canvasen verkligen hör till den aktuella editor-sessionen/fotot.
- Om föregående bild fortfarande ligger i refs/canvas kan samma komposition sparas på nästa `photoId`.
- Det matchar exakt symptomet i kundens screenshot: samma redigerade exteriör hamnar på flera olika positioner i griden.

3. `src/pages/CarDetail.tsx`
- Batchflödet använder globalt, muterbart queue-state (`editFlowQueue.currentIndex`) när save sker:
  - `const originalPhoto = editFlowQueue.photos[editFlowQueue.currentIndex]`
- Samtidigt öppnas nästa bild sekventiellt via polling/async queue.
- Det gör kopplingen mellan “det användaren precis såg i editorn” och “vilken rad som uppdateras nu” onödigt skör.
- Det är en separat race risk ovanpå stale-canvas-buggen.

4. `src/pages/CarDetail.tsx`
- `onOpenChange` använder rå `positionEditorPhoto`/`editFlowQueue` i close-pathen i stället för ett fryst snapshot av aktiv session.
- Det ökar risken att sena/stale callbacks skriver metadata mot fel foto när flödet hoppar vidare.

Det här betyder:
- Huvudproblemet sitter i frontendens editor-flöde, före lagring.
- Mest sannolika kedjan är:
  1. Bild A laddas i editorn
  2. Flödet går vidare till bild B
  3. Editorn har fortfarande refs/canvas från A
  4. Save för B exporterar i praktiken A:s komposition
  5. Flera foto-rader får därför samma färdiga motiv

Low-risk plan:
1. Hårdsäkra `CarPositionEditor`
- Nollställ alltid:
  - `bgImgRef.current = null`
  - `carCanvasRef.current = null`
  - `setImagesLoaded(false)`
- Gör detta direkt när `open`, `transparentCarUrl`, `backgroundUrl` eller `backgroundColor` ändras.

2. Lägg till session-guard i editorn
- Inför ett internt `loadSessionId`.
- Varje ny editor-load får ett nytt id.
- `onload` för bakgrund/bil får bara skriva till refs/state om session-id fortfarande matchar.
- Sena laddningar från gamla bilder ignoreras helt.

3. Lås save till rätt session
- `handleSave()` ska bara få exportera när aktuell session fortfarande är aktiv och komplett laddad.
- Om sessionen hunnit bytas: avbryt save i stället för att skriva fel bild.

4. Frys vilket foto som sparas i batchflödet
- I `CarDetail.tsx`, spara ett explicit snapshot för aktiv editor-session:
  - `photoId`
  - `originalUrl`
  - `transparentCarUrl`
  - `flowId`
- Sluta läsa `editFlowQueue.currentIndex` som källa vid save/close.
- Save ska använda snapshot från det foto som faktiskt öppnade editorn.

5. Strama upp close-pathen
- `onOpenChange(false)` ska bara få påverka den aktiva sessionen.
- Använd samma snapshot/sessions-id där också.
- Undvik att stale close-events kan skriva metadata till fel rad.

6. Litet skyddsnät i galleriet
- Utöka sync-jämförelsen i `PhotoGalleryDraggable.tsx` så den även reagerar på fler fält som kan ändras under async-flöden:
  - `original_url`
  - `transparent_url`
  - `updated_at`
- Detta är inte huvudfixen, men minskar risken för stale UI efter backend-uppdateringar.

Vad jag inte tänker röra i första fixen:
- Ingen databasändring
- Ingen storage-strukturändring
- Ingen större refaktor av hela edit-kön
- Ingen ändring av fungerande AI/backendlager om det inte krävs efter verifiering

Verifiering efter fix:
1. Repro med 4–6 huvudbilder i batch-redigering.
2. Växla snabbt genom position-save flera gånger.
3. Kontrollera att varje `photoId` får unik slutbild.
4. Bekräfta att grid, lightbox och realtime visar samma bild per rad.
5. Testa även:
- manuell “Justera position”
- “Generera ny skugga och reflektion”
- stäng editor mitt i flöde
- interiörflöde med bildbakgrund

Tekniskt beslut:
- Jag skulle börja med isolerad fix i:
  - `src/components/CarPositionEditor.tsx`
  - `src/pages/CarDetail.tsx`
  - liten komplettering i `src/components/PhotoGalleryDraggable.tsx`
- Det är lägsta risk och adresserar den exakta typ av race som kan skapa kundens resultat.
