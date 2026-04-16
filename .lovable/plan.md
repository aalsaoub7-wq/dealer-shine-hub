
Mål: stänga alla kända vägar som kan ge “fel bild på fel plats” när användaren redigerar många bilder samtidigt.

Det jag nu vet, inte bara tror:
- Storage-paths i backend krockar inte mellan olika foton:
  - `segment-car` skriver `transparent-{photoId}.png`
  - `add-reflection` skriver `edited-{photoId}-{timestamp}.png`
- Griden använder stabila React-keys (`photo.id`), så detta är inte ett key-problem.
- Den tidigare fixen i `CarPositionEditor` var rätt, men den räcker inte ensam.
- Det finns fortfarande flera samtidighetsproblem i `CarDetail.tsx` som kan återöppna/styra fel foto när många jobb pågår samtidigt.

Exakta återstående risker jag hittade:
1. Gamla pollers kan hoppa in i ett nytt edit-flöde
- `advanceEditFlowQueue()` och `advanceInteriorImageQueue()` öppnar nya editor-sessioner med live-värdet `editFlowIdRef.current`.
- Om användaren startar ett nytt flöde medan gamla `setTimeout`-pollers fortfarande lever kan ett gammalt flöde “ärva” det nya flow-id:t och öppna fel foto i den nya sessionen.

2. Close-pathen läser rå state istället för render-säkrad state
- `onOpenChange(false)` använder `positionEditorPhoto`, inte den guardade `safePhoto`.
- Ett sent close-event kan därför skriva `transparent_url`, nollställa `is_processing` eller döda fel queue.

3. Överlappande edit-flöden blockeras inte hårt
- Användaren kan batch-redigera, sedan börja regenerera eller justera annan bild innan gamla pollers/background-jobs är helt klara.
- Det finns ingen central klientlåsning för “en aktiv studio-flow åt gången”.

4. Samma foto kan få flera samtidiga jobb
- Samma rad kan träffas av:
  - batch-position save
  - manuell position save
  - regenerate reflection
  - segmentering/cache-save
  - edge-funktionens best-effort update
- Då blir det “last write wins” på `photos`, särskilt för `url`, `original_url`, `transparent_url`, `is_processing`.

5. Watchdog kan öppna upp för dubbelkörning
- `resetStuckPhotos()` nollställer `is_processing` efter 90 sekunder.
- Om ett legitimt jobb fortfarande kör kan bilden bli klickbar/redigerbar igen medan första jobbet ännu inte är färdigt.

6. Edge functions är inte huvudorsaken, men de kan förstärka race-läget
- `add-reflection` uppdaterar samma `photos`-rad server-side “best effort”, samtidigt som klienten också uppdaterar den.
- Det skapar inte filkrockar, men det ger extra skrivningar som kan interleava med klientflöden.

Plan för att göra detta robust:
1. Frys flow-ägarskap ordentligt
- Lägg ett immutabelt `flowId` i queue-state, inte bara i `editFlowIdRef`.
- Alla pollers och queue-advances måste använda det frysta flow-id:t, aldrig `editFlowIdRef.current`.
- På nytt flöde: cancel:a alla gamla timers/pollers explicit.

2. Hårdsäkra editor close/save
- Låt både save och close arbeta mot ett fryst “active editor snapshot”.
- Sluta läsa rå `positionEditorPhoto` i close-pathen.
- Ignore:a sena close/save-callbacks om session-id eller flow-id inte matchar aktiv session.

3. Inför klientlås för samtidiga redigeringar
- Blockera start av nytt studio/interior-flöde medan ett inkompatibelt flöde redan är aktivt.
- Blockera också nya operationer på ett foto som redan ligger i queue eller bearbetas i bakgrunden.
- Gör detta både i knapparna och i handler-logiken.

4. Inför per-foto operation tokens
- Ge varje async-operation ett `operationId` per foto i klienten.
- Före varje DB-update: verifiera att operationen fortfarande är den senaste för just det fotot.
- Det skyddar mot att äldre async-svar skriver över nyare resultat.

5. Strama upp `is_processing`-strategin
- Låt watchdog ignorera foton som tillhör en aktiv lokal queue/session.
- Höj eller gör timeout-stage-aware för långa steg som faktiskt får ta tid.
- Säkerställ att en bild inte blir “redigerbar igen” mitt under pågående bakgrundsjobb.

6. Minska dubbelskrivning mellan klient och backend
- Bestäm tydligt ägarskap per steg:
  - antingen edge-funktionen uppdaterar raden
  - eller klienten gör slutupdate
- För `add-reflection` bör vi välja en primär writer och göra den andra vägen passiv.

7. Bevara gallery-consistency
- Behåll utökad sync i `PhotoGalleryDraggable`.
- Lägg även in skydd så att kort inte visar gammal bild när ett foto har bytt operation men URL ännu inte hunnit uppdateras klart.

Testmatris jag vill köra efter godkännande:
- Batch-redigera 5–10 bilder och spara snabbt vidare mellan dem
- Starta batch, öppna sedan manuell “Justera position” på annan bild
- Starta batch, kör “Generera ny skugga och reflektion” på annan bild samtidigt
- Kör två olika batcher efter varandra utan att vänta ut gamla pollers
- Justera samma foto två gånger tätt inpå
- Interiör batch med bildbakgrund
- Stäng editor mitt i batch
- Låt ett jobb gå länge så watchdog hinner slå till
- Verifiera grid, lightbox, DB-rad och slutliga storage-URL:er för samma foto

Tekniska ändringar:
- `src/pages/CarDetail.tsx`
  - flow ownership, timer cleanup, active snapshot, per-photo op tokens, stricter guards
- `src/components/CarPositionEditor.tsx`
  - behåll session guard, komplettera med save/close-token från parent
- `src/components/PhotoGalleryDraggable.tsx`
  - behåll förstärkt sync, ev. disable actions för queued/locked photos
- `supabase/functions/add-reflection/index.ts`
  - justera writer-ansvar så klient/backend inte tävlar om samma slutupdate

Bedömning:
- Huvudfelet är fortfarande concurrency i frontendflödet, inte att backend skriver samma fil till flera foton.
- Men för att det “inte ska kunna hända igen” behöver vi nu täppa till både:
  - stale editor/session-problem
  - stale pollers
  - överlappande flöden
  - dubbelskrivningar mellan klient och backend
  - watchdog-resets under legitima jobb
