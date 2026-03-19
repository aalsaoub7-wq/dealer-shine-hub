
Mål: Fixa att batch-redigering (AI redigera) stannar efter ~2 bilder, med absolut minimal och låg-risk ändring.

1) Bekräftad scope (ingen sid-effekt)
- Endast `src/pages/CarDetail.tsx`.
- Endast flödet `handleEditPhotos` (studio/AI redigera).
- Ingen ändring av UI, databasschema, policys, andra funktioner eller andra sidor.

2) Rotorsak jag adresserar
- Kölogiken startar 2 workers, men worker-kedjan är skör: om en worker får ett okapslat fel (innan nuvarande catch-path fångar allt relevant), så dör den worker-kedjan.
- När båda kedjorna dör tidigt ser det ut som att bara de första 2 (ibland 2–3) bilderna blir redigerade.

3) Minimal implementation (enbart i `handleEditPhotos`)
- Göra worker-flödet “fail-safe” utan att ändra affärslogik:
  - Flytta hela per-bildflödet till en sammanhållen `try/catch/finally` så att även tidiga fel fångas.
  - Säkerställ att nästa bild i kön alltid startas i `finally` (så kön fortsätter även efter fel på en enskild bild).
  - Behåll befintliga timeouts, API-anrop, `MAX_CONCURRENT = 2`, och befintliga toast-meddelanden.
- Göra worker-start robust:
  - Byta från “fire-and-forget” till robust hantering av worker-promises (all workers får köra färdigt utan att kedjan tyst bryts).

4) Vad jag uttryckligen INTE ändrar
- Ingen ändring av watchdog-intervall/threshold.
- Ingen ändring av interiör-redigering, watermark, regenerate, position-editor.
- Ingen ändring av edge functions eller backend-tabeller.
- Ingen ny feature, ingen refaktor utanför den lilla kön i `handleEditPhotos`.

5) Verifiering (end-to-end, exakt detta fall)
- Välj 10–20 huvudbilder, kör “AI redigera”.
- Bekräfta att fler än de första 2 faktiskt går igenom och att hela kön dräneras.
- Bekräfta att fel på en enskild bild inte stoppar resterande bilder i batchen.
