
## Problem

Frontend-valideringen i `src/lib/blocket.ts` blockerar Blocket-synk om `model`, `year`, `price` eller `make` saknas. Men backend-koden (`blocketSyncService.ts`) har redan placeholder-logik som fyller i ALLA dessa fält automatiskt. Användaren ska aldrig behöva fylla i data själv — placeholders ska alltid skickas med.

## Ändring

**En enda fil: `src/lib/blocket.ts`** — funktionen `validateCarForBlocket` (rad 114-128).

Ta bort alla obligatoriska fältkontroller. Funktionen ska alltid returnera `null` (= godkänd) och låta backend hantera allt med placeholders.

Före:
```ts
export function validateCarForBlocket(car: any): string | null {
  if (!car.make) return "Bilmärke saknas";
  if (!car.model) return "Modell saknas";
  if (!car.year) return "Årsmodell saknas";
  if (!car.price) return "Pris saknas";
  // ...warnings...
  return null;
}
```

Efter:
```ts
export function validateCarForBlocket(car: any): string | null {
  // Backend hanterar saknade fält med placeholders (visible=false tills riktig data finns)
  // Ingen frontend-validering krävs
  return null;
}
```

## Konsekvensanalys

- **Påverkan**: Enbart Blocket-sync flödet. `validateCarForBlocket` anropas bara i `useBlocketSync.ts`.
- **Ingen påverkan på**: Biluppladdning, AI-redigering, galleri, Wayke-sync, betalning, auth, eller något annat.
- **Backend-säkerhet**: Backend sätter `visible: false` om placeholder-värden används, så annonsen syns inte på Blocket förrän riktig data finns.
- **Risknivå**: Minimal — tar bort 4 rader villkor, ersätter med en kommentar. Inga nya imports eller beroenden.
