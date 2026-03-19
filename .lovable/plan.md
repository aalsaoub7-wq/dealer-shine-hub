

# Autosave anteckningar vid varje ändring

## Vad som ändras

**Enda fil:** `src/pages/CarDetail.tsx`

## Ändring

Byt `onChange` på Textarea (rad 1819) till att debounce-spara direkt till databasen vid varje ändring, istället för att förlita sig på "Spara"-knappen.

Konkret:
1. Lägg till en `useRef` för en debounce-timer.
2. I `onChange` på Textarea: uppdatera `editedNotes` som idag, men starta även en debounce (t.ex. 1 sekund) som anropar `handleSaveNotes` automatiskt.
3. Behåll "Spara"-knappen som den är (för manuell snabbsparning) — ingen UI-ändring krävs.

## Teknisk detalj

```text
// Ny ref
const notesDebounceRef = useRef<NodeJS.Timeout>();

// Ny onChange-handler
const handleNotesChange = (value: string) => {
  setEditedNotes(value);
  clearTimeout(notesDebounceRef.current);
  notesDebounceRef.current = setTimeout(() => {
    // Spara direkt till DB (same logic as handleSaveNotes)
    supabase.from("cars").update({ notes: value }).eq("id", id)
      .then(({ error }) => {
        if (!error) setCar(prev => prev ? { ...prev, notes: value } : prev);
      });
  }, 1000);
};
```

Textarea onChange ändras från `(e) => setEditedNotes(e.target.value)` till `(e) => handleNotesChange(e.target.value)`.

Notera: `handleSaveNotes` använder `editedNotes` från state, men debounce-callbacken behöver använda `value` direkt (closure-problem med stale state). Därför gör vi DB-anropet inline med det aktuella värdet.

## Risk
Ingen. Rent additivt — lägger till autosave bredvid befintlig manuell sparning. Spara-knappen finns kvar som backup.

