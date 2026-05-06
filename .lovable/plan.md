
## Add Tooltips to Tab Triggers

### Changes — single file: `src/pages/CarDetail.tsx`

1. **Add import** (after line 7):
   ```
   import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
   ```

2. **Wrap `<TabsList>` in `<TooltipProvider>`** and wrap each `<TabsTrigger>` in a `<Tooltip>` + `<TooltipTrigger asChild>` + `<TooltipContent>`:
   - Huvudfoton → "Huvudfoton för annonser"
   - Dokumentation → "Dokumentationsbilder för internt bruk"
   - Skadebilder → "Bilder på skador och defekter"

No other files or flows touched.
