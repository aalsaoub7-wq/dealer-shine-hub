

# Sänk total timeout till 70 sekunder

## Nuläge

| Komponent | Nuvarande timeout |
|-----------|------------------|
| `segment-car` API-anrop | 60 sekunder |
| `add-reflection` API-anrop | 90 sekunder (på 4 ställen), 120 sekunder (på 1 ställe) |
| Watchdog (nollställer fastlåsta bilder) | 2 minuter (120 sekunder) |

## Ändringar

Alla ändringar sker i **en enda fil**: `src/pages/CarDetail.tsx`

### 1. Sänk `add-reflection` timeout från 90s/120s till 70s
- Rad 648: `90000` -> `70000`
- Rad 943: `90000` -> `70000`
- Rad 1033: `90000` -> `70000`
- Rad 1239: `120000` -> `70000`

### 2. Sänk watchdog-gränsen från 2 minuter till 70 sekunder
- Rad 168: `2 * 60 * 1000` -> `70 * 1000`
- Rad 230 (kommentar): Uppdatera "~2 minutes" till "~70 seconds"

### Vad som INTE ändras
- `segment-car` timeout (redan 60s, under 70s-gränsen)
- All annan logik, databas, edge functions, frontend-komponenter
- Watchdog-intervallet (var 10:e sekund) -- bara tröskeln ändras
