
Mål
- Inga bilder ska kunna fastna i “Bild Behandlas” igen.
- Om AI-flödet inte blir klart inom 2 minuter: bilden ska automatiskt sluta processa och toasten ska visas med exakt text: “Vår AI fick för många bollar att jonglera”.
- EXTREMT LOW RISK: inga ombyggnader, inga nya tabeller, inga förändringar i lyckade flöden.

1) Vad som händer just nu (verifierat)
1.1 Bekräftelse i databasen (Joels Bil / VW Tiguan)
Jag ser exakt samma 6 foton fortfarande markerade som `is_processing = true` med `updated_at ≈ 15:04:47Z` (dvs flera minuter gamla), trots att AI-funktionerna i backend faktiskt verkar ha producerat filer (loggar visar uppladdade resultat för samma photo_id).
Det innebär:
- AI-steget kan lyckas (filen finns uppladdad)
- men klienten (webb/appen) “fastnar” innan den hinner skriva tillbaka till databasen att `is_processing=false` och uppdatera URL.

1.2 Rotorsak (varför fastnar det “för alltid”)
I CarDetail.tsx sätts `is_processing: true` i början av en edit.
Sedan körs en kedja av steg där flera kritiska await:ar saknar timeout:
- `fetch(photo.url)` + `response.blob()` (ingen timeout)
- slutliga `.from("photos").update({... is_processing:false ...})` (ingen timeout)
- ibland även pre-steg (t.ex. interior background segment) har fetch utan timeout

Om något av dessa await:ar hänger (svajig uppkoppling, mobil, tabbar bort appen, request som aldrig returnerar) så körs aldrig catch/finally → `is_processing` lämnas “true” och UI visar “Bild Behandlas” tills någon manuellt nollställer.

1.3 Varför nuvarande “skyddsnät” inte räcker
- `resetStuckPhotos()` finns, men reset:ar först efter 10 minuter och bara vid sidladdning.
- Det löser inte kravet “timeout efter 2 minuter” och hjälper inte om användaren sitter kvar på sidan.

2) Minimal fixstrategi (två lager, båda additive)
För att det här inte ska kunna hända igen behöver vi:
A) Ett klient-skydd som garanterar 2-minuters-timeout och toast (oavsett var det hänger)
B) Ett server-skydd som gör att om AI lyckas men klienten inte hinner uppdatera DB, så blir bilden ändå “klar” (detta är exakt scenariot som Joels Bil verkar drabbas av nu)

Detta är fortfarande low risk eftersom vi inte ändrar algoritmerna eller flödet – vi lägger bara till “failsafes”.

3) Ändringar (EXTREMT små, avgränsade)
3.1 CarDetail.tsx: Gör timeouten verklig efter 2 minuter (utan att röra AI-logiken)
Ändring: uppdatera befintlig `resetStuckPhotos()`:
- Byt 10 minuter → 2 minuter (120000ms)
- Låt den returnera vilka photo_id som nollställdes (via `.select("id")` på update)
- Om minst 1 foto reset:as: visa toast med exakt text:
  - title: valfritt (t.ex. “Oj!”)
  - description: “Vår AI fick för många bollar att jonglera”
  - variant: “info”

Lägg till ett extremt lätt “watchdog”-intervall som bara kör när man är på CarDetail:
- Starta interval (t.ex. var 10:e sekund) som kör resetStuckPhotos(2 min)
- Stoppa interval på unmount
- (Valfritt extra low risk) Kör interval endast om det finns minst ett foto i state som har `is_processing=true` för att minimera belastning.

Detta gör att:
- oavsett om fetch/blob/DB-update/edge-call hänger → efter max ~2 minuter slutar bilden vara “Bild Behandlas”
- toasten visas automatiskt utan att användaren behöver ladda om

3.2 add-reflection backend-funktion: Skriv tillbaka “klart” även om klienten dör (fixar exakt nuvarande scenario)
Ändring: i `supabase/functions/add-reflection/index.ts`, efter att publicUrl är skapad:
- Om `photoId` finns:
  1) Läs nuvarande raden i `photos` (minst `url`, `original_url`)
  2) Uppdatera raden server-side:
     - `url = publicUrl`
     - `is_processing = false`
     - `is_edited = true`
     - `original_url = (original_url om den redan finns) annars (gamla url:en)`
- Viktigt för low risk: om DB-update misslyckas → logga och returnera ändå `{ url: publicUrl }` som idag. Dvs inga nya hårda failure modes.

Varför detta är kritiskt:
- Just nu verkar AI faktiskt producera filen, men klienten “fastnar” innan DB-uppdateringen.
- Med server-side “best effort” DB-update kan en bild inte bli kvar i processing om add-reflection hann bli klar, även om användaren tappar nät, stänger appen, eller klienten hänger.

3.3 Standardisera toast-texten (minimal, bara text)
I CarDetail.tsx finns flera catch-toasts som idag säger “Vår AI fick lite för många bollar…” + “Försök igen.”
Ändring (low risk): byt dessa beskrivningar till exakt:
- “Vår AI fick för många bollar att jonglera”
Så får ni konsekvent UX och exakt den text du kräver.

4) Varför detta är EXTREMT LOW RISK
- Vi ändrar inte hur bilder redigeras (ingen ny AI-logik).
- Vi ändrar inte databasschema.
- Vi lägger bara till:
  1) en tidsbaserad “auto-unlock” av is_processing (som du uttryckligen vill ha efter 2 min)
  2) en server-side “best effort” DB-write efter lyckad add-reflection (additivt, kan inte påverka lyckade flöden negativt)

5) Hur vi verifierar att det aldrig kan fastna igen (end-to-end)
Test A: Normalt AI-edit
- Starta AI edit på 1 bild
- Verifiera att den blir klar som vanligt
- Verifiera att inga extra toasts kommer i lyckade fall

Test B: Simulera klient-häng / tappad uppkoppling
- Starta AI edit på 1 bild
- Stäng tabben/appen direkt (eller slå på flygplansläge) under tiden
Förväntat:
- add-reflection kan fortfarande hinna bli klar → servern uppdaterar photo-raden → när du öppnar igen är `is_processing=false` och url pekar på redigerad bild
- Om den inte hann bli klar: watchdogen i CarDetail reset:ar efter 2 minuter och visar toasten

Test C: Verifiera 2-minuters-timeout
- Medvetet gör nätet instabilt / throttla
- Om något steg hänger: efter max ~2 min ska overlay släppa och toasten “Vår AI fick för många bollar att jonglera” visas

6) Akut: “Se till att Joels Bil inte fortfarande är stuck”
När vi implementerat ovan:
- Så fort Joels öppnar bilens sida kommer 2-minuters-reset slå till och nollställa alla som är äldre än 2 minuter.
- Dessutom: för framtida edits där add-reflection hinner bli klar kommer servern självläka DB även om klienten inte hinner skriva tillbaka.

7) Rollback-plan (om du vill backa utan risk)
- CarDetail: återställ intervallet + ändra tillbaka 2 min → 10 min (1 funktion + 1 useEffect)
- add-reflection: ta bort DB-update-blocket (funktionen fortsätter returnera url exakt som idag)
Inga migrations, inget dataformat, inget som låser er.

Scope (filer som ändras)
- src/pages/CarDetail.tsx
  - 2-min reset + intervall-watchdog + toast vid reset + standardiserad toast-text
- supabase/functions/add-reflection/index.ts
  - Additiv DB-update efter lyckad upload (med original_url-säkring)

Resultat
- “Bild Behandlas” kan inte bli permanent längre.
- Timeout efter 2 minuter är garanterad och toasten visas.
- Om AI faktiskt lyckades men klienten dog/hängde så blir bilden ändå klar (det som verkar drabba Joels Bil just nu).
