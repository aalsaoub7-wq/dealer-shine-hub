
# Öka timeout för bilder under behandling till 90 sekunder

## Översikt
Ändra alla timeout-värden från 70 sekunder till 90 sekunder i `src/pages/CarDetail.tsx`.

## Ändringar -- EN fil: `src/pages/CarDetail.tsx`

### 6 ställen att ändra:

1. **Rad 176**: Watchdog-reset tröskeln: `70 * 1000` -> `90 * 1000`
2. **Rad 239**: Kommentar: "~70 seconds" -> "~90 seconds"
3. **Rad 658**: `withTimeout` vid initial redigering: `70000` -> `90000`
4. **Rad 953**: `withTimeout` vid regenerering: `70000` -> `90000`
5. **Rad 1055**: `withTimeout` vid position-save: `70000` -> `90000`
6. **Rad 1254**: `withTimeout` vid batch-redigering: `70000` -> `90000`

## Vad som INTE ändras
- Edge-funktioner, prompter, UI, databas, watchdog-intervall (fortfarande var 10:e sekund)
- All annan logik i hela appen
