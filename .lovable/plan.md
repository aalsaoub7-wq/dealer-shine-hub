# Plan: verifierad diagnos och minimal fix för Blocket 403

## Verifierade fynd

1. **Koden skickar redan rätt fält på den nivå vi kan bevisa i repo/loggarna**
   - Edge-loggen visar att request-payloaden innehåller `dealer_code: "joelsbilab"`.
   - HTTP-klienten skickar `X-Auth-Token` som header.
   - Alltså är felet **inte** att dealerkoden helt saknas i requesten.

2. **403 kommer från Blocket, inte från vår auth eller vår databas**
   - Edge-loggen visar: `Blocket API error 403: {"detail":"You do not have permission to perform this action."}`.
   - Det betyder att Blocket tar emot requesten men nekar behörighet för just kombinationen token / dealer-scope / dealer_code / endpoint.

3. **Det finns en konkret och verifierbar risk i vår kod som kan göra att fel token fortsätter användas**
   - `PlatformSyncDialog.tsx` sparar Blocket-credentials med `.update(...).eq("company_id", car.company_id)`.
   - `ai_settings` har unik `company_id`, och andra delar av appen använder `upsert()` för samma tabell.
   - Om det inte redan finns en rad i `ai_settings` för företaget gör `update()` ingen insert alls.
   - Det är en verklig buggrisk eftersom backend då kan falla tillbaka till global `BLOCKET_API_TOKEN` i edge-funktionen.

4. **Nuvarande fallback i backend maskerar felsökning**
   - `blocket-sync/index.ts` gör:
     - använd företags-token om den finns
     - annars fall back till global `BLOCKET_API_TOKEN`
   - Det gör att UI:t kan se ut att ha sparat nya uppgifter, men syncen kan fortfarande köras med en annan gammal token.

## Minimal och low-risk fix

1. **Byt Blocket-sparningen i UI från `update()` till `upsert()`**
   - Endast i `src/components/PlatformSyncDialog.tsx`.
   - Skriv `company_id` och befintliga Blocket-fält i samma operation.
   - Detta följer redan etablerat mönster i `AiSettingsDialog.tsx`.

2. **Ta bort fallback till global Blocket-token i just `blocket-sync`-flödet**
   - Endast i `supabase/functions/blocket-sync/index.ts`.
   - Om företaget saknar egen `blocket_api_token`, returnera tydligt konfigurationsfel istället.
   - Detta är säkrare för felsökning och påverkar inte andra funktioner, eftersom ändringen begränsas till Blocket-sync.

3. **Behåll request-formatet i övrigt oförändrat**
   - Ingen ändring av payloadstruktur.
   - Ingen ändring av `dealer_code`-placering.
   - Ingen ändring av hur andra plattformar eller övriga AI-inställningar fungerar.

## Varför detta är minimal risk

- **Frontend-risk:** låg
  - `upsert()` används redan i projektet för `ai_settings`.
  - Vi rör bara Blocket-sparningen, inte övriga inställningsflöden.

- **Backend-risk:** låg om vi begränsar ändringen till Blocket-sync
  - Vi rör inte Blocket payload-mappning, bilfält, bildhantering eller databasschema.
  - Vi rör inte Wayke, biluppladdning, bildredigering, betalning eller auth.
  - Endast fallback-beteendet för token i just Blocket-edgefunktionen blir striktare.

- **Vad vi uttryckligen inte ändrar**
  - Ingen migration.
  - Ingen ändring i `blocketClient.ts` header-format just nu, eftersom nuvarande kod och loggar redan visar att Blocket tar emot requesten och svarar med behörighetsfel, inte formatfel.
  - Ingen refaktor av andra `ai_settings`-anrop.

## Konsekvenser av föreslagen fix

### Positiva
- Vi får säkerhet i att sync använder den token som användaren faktiskt matat in för företaget.
- Vi eliminerar ett felsökningsmaskerande fallback-beteende.
- Vi minskar risken att “sparat” i UI inte motsvarar vad backend verkligen använder.

### Medveten tradeoff
- Företag som tidigare råkade fungera tack vare global fallback kommer efter ändringen få ett tydligt konfigurationsfel tills deras egen token finns sparad.
- Det är avsiktligt, eftersom nuvarande beteende gör felsökningen opålitlig.

## Validering efter implementation

Jag kommer verifiera följande efter ändringen:

1. **Kodvalidering av scope**
   - Bekräfta att endast dessa filer ändrats:
     - `src/components/PlatformSyncDialog.tsx`
     - `supabase/functions/blocket-sync/index.ts`

2. **Funktionsvalidering**
   - Kontrollera att Blocket-dialogen fortfarande laddar befintliga värden.
   - Kontrollera att sparning fortfarande fungerar för företag som redan har `ai_settings`.
   - Kontrollera att företag utan `ai_settings` nu får en rad skapad korrekt.

3. **Konsekvensvalidering**
   - Verifiera att Wayke-flödet inte rörs.
   - Verifiera att övriga `ai_settings`-flöden inte ändrats.
   - Verifiera att syncfel blir tydligare och inte längre kan använda dold fallback-token.

## Förväntat resultat

Efter fixen finns två möjliga utfall, båda användbara:

1. **Sync börjar fungera**
   - Då var grundproblemet att fel token faktiskt användes trots att ny token matades in.

2. **Sync ger fortfarande 403 från Blocket**
   - Då vet vi, utan fallback-brus och utan gissning, att exakt den företagssparade token+dealerkod-kombinationen nekas av Blocket.
   - Då är problemet externt i behörigheten hos de credentials Blocket skickat, inte i att vår kod tappar bort dem.
