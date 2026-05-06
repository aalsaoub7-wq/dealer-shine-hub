## Problem

Knapparna fyller inte hela bredden på mobil pga två saker:
1. Varje `TabsTrigger` är inuti en `<span>` (Tooltip-wrapper) som inte har `flex-1`, så den yttre span:en begränsar bredden.
2. `sm:flex-none` och `sm:w-auto` slår in vid 640px, men mobilvyn är upp till 768px (`md`).

## Ändring

**`src/pages/CarDetail.tsx`** — 4 ändringar i samma område:

1. **TabsList (rad 2164):** Ändra `w-full sm:w-auto` → `w-full md:w-auto`
2. **Alla tre `<span>`-wrappers (rad 2167, 2181, 2195):** Lägg till `className="flex-1 md:flex-none"` på span-elementen så de tar upp jämnt utrymme.
3. **Alla tre TabsTrigger (rad 2170, 2184, 2198):** Ändra `flex-1 sm:flex-none` → `w-full md:w-auto md:flex-none` samt lägg till `w-full` på mobil.

Desktop (`md:` och uppåt) förblir exakt oförändrat.
