
## Problem
- "Markera alla" och "Ladda upp huvudfoton" byter position beroende på om action-knappar (Dela, Ladda ned, etc.) visas.
- Layouten ser rörig ut med alla knappar staplade.

## Lösning
Byt ordningen så att **fixed-raden (Markera/Ladda upp) alltid ligger överst** och action-knapparna visas **under** den. Detta gör att Markera + Ladda upp aldrig flyttar sig.

### Ändringar i `src/pages/CarDetail.tsx` (rad 2210–2349)

1. **Flytta fixed-raden (Markera alla + Ladda upp) FÖRE action-knapparna** — den ligger alltid överst och fast.
2. **Action-knapparna (Dela, Ladda ned, etc.) renderas under** fixed-raden, bara när bilder är markerade.
3. Behåll all befintlig funktionalitet, onClick-handlers och conditional rendering exakt som den är.

Rent visuellt:
```text
┌──────────────────────────────────────────────────┐
│ [Markera alla]                [Ladda upp huvud.] │  ← alltid synlig, fast
├──────────────────────────────────────────────────┤
│ [Dela] [Ladda ned] [Interiör] [AI] [Vatten] [Ö] │  ← bara vid markering
└──────────────────────────────────────────────────┘
```

Ingen backend-ändring. Ingen logik-ändring. Bara ordningen av de två `div`-blocken byts.
