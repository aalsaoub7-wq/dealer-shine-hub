

# Förtydliga prompten för borttagning av registreringsskylt

## Översikt
Ändra prompttexten som skickas till Gemini vid val "Ta bort reg skylt" så att den tydligt instruerar att ta bort de svarta bokstäverna och siffrorna och lämna skylten vit.

## Ändring -- EN fil: `supabase/functions/add-reflection/index.ts`

### Rad 53: Uppdatera `plateInstruction`-strängen

**Från:**
```
" Also remove or obscure the text/numbers on the license plate so it is not readable, but keep the plate itself intact."
```

**Till:**
```
" Also remove all black letters and numbers from the license plate, making the plate appear completely white/blank with no visible text or characters, but keep the plate shape itself intact."
```

## Vad som INTE ändras
- All annan logik, state, UI, timeouts, watchdog, compositing
- Prompten vid "Behåll reg skylt" (ingen plateInstruction)
- Ingen frontend-ändring
- Inga databasändringar

