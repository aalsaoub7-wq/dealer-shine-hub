
## Transfer button → dialog with tab choice

### Changes — single file: `src/pages/CarDetail.tsx`

1. **Add Dialog import** (line ~8 area):
   ```
   import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
   ```

2. **Add state** for the transfer dialog:
   ```
   const [transferDialogOpen, setTransferDialogOpen] = useState(false);
   ```

3. **Replace the transfer Button's onClick** (lines 2332-2361):
   - Button text becomes: `Överför (N)` where N is selected count
   - onClick opens the dialog instead of directly transferring

4. **Add Dialog JSX** (near the other dialogs at the bottom):
   - Shows two buttons for the other two tabs (excluding current `activeTab`)
   - Each button runs the same transfer logic that exists now but with the chosen target type
   - Uses same styling as other dialogs (`bg-card border-border`)
   - Tab labels: Huvudfoton, Dokumentation, Skadebilder with their respective icons

### What stays the same
- The actual transfer logic (supabase update, local state update, selection clear) is identical
- All other buttons, tabs, upload, AI editing, watermark flows untouched
- No new components or files
