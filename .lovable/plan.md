## Plan

I found the remaining bottleneck: the current reorder flow still sends one database update per photo after every drag. In the network snapshot, a single reorder is triggering many `PATCH /photos?id=eq...` requests. That means the UI feels slow even though the visible flicker was partially reduced.

I’ll keep this minimal and isolated to the reorder path only.

### 1) Make drag-drop truly optimistic in the gallery
Update `src/components/PhotoGalleryDraggable.tsx` so the gallery state changes immediately and stays local while the save happens in the background.

Changes:
- Keep the immediate `setItems(newItems)` behavior.
- Replace the current `Promise.all([...one update per photo...])` approach with a single backend reorder call.
- Keep the existing rollback behavior: if the save fails, restore the previous `photos` order and show the existing error toast.

Why this is low risk:
- Only touches the reorder save path.
- No changes to upload, delete, edit, watermark, sharing, lightbox, or selection behavior.
- UI interaction pattern stays the same; only the persistence method changes.

### 2) Add one dedicated backend function for photo reordering
Create a migration that adds a small database function for reordering photos in one call.

Function behavior:
- Accept an array of `{ id, display_order }` values.
- Update only those matching photo rows.
- Run under existing row-level security so users can only reorder photos they already have access to.
- No schema refactor, no table redesign, no policy broadening.

Why this is safer than the current approach:
- One request instead of dozens of requests.
- Less network overhead.
- Fewer realtime events and less chance of out-of-order completion.
- Better consistency for the dashboard preview, since the final persisted order lands as one operation.

### 3) Tighten the drag refetch guard without affecting other flows
Adjust the current drag guard in `src/pages/CarDetail.tsx` so it is tied to the reorder save lifecycle rather than a fixed 1.5s timeout.

Changes:
- Keep the existing idea of suppressing realtime-driven refetch during active reorder.
- Clear that guard when the single reorder save completes, instead of waiting on an arbitrary timeout.
- Optionally trigger one safe refresh after completion only if needed.

Why this is lower risk than the current timeout:
- Avoids refetching too early on slow networks.
- Avoids keeping the page blocked longer than necessary on fast networks.
- Leaves all non-drag realtime updates unchanged.

### 4) Preserve dashboard preview behavior from persisted order
Keep `src/pages/Dashboard.tsx` using the first main photo ordered by `display_order ASC`.

I do not plan to change the dashboard query unless inspection during implementation shows a real edge case. Right now the dashboard logic is already correct; the problem is that reorder persistence is too noisy/slow.

### 5) Validate only the affected surfaces
After implementation, validate the narrowest possible surface area:
- Drag main photos repeatedly and confirm the grid reorders instantly without loading overlays/skeleton behavior.
- Drag documentation photos and confirm the same behavior.
- Refresh the car page and confirm order persists.
- Return to dashboard and confirm the top-left main photo is the preview image.
- Spot-check that delete, selection, lightbox open, watermark options, and regenerate button still behave unchanged.

## Consequence / Risk Check

What this changes:
- Only how photo order is persisted.
- Minor synchronization logic around drag completion.

What this does not change:
- Photo rendering model outside reorder.
- AI edit flow.
- Upload flow.
- Watermark flow.
- Interior flow.
- Share/download flow.
- Auth, billing, or any unrelated backend logic.

Main risk:
- The new backend reorder function must be scoped carefully so it only updates allowed rows.

Mitigation:
- Use a narrowly scoped function for `photos` only.
- Reuse existing access protections.
- Keep frontend fallback/rollback on failure.

## Technical details

Planned files:
- `src/components/PhotoGalleryDraggable.tsx`
- `src/pages/CarDetail.tsx`
- new SQL migration under `supabase/migrations/`

Implementation shape:
```text
Drag end
  -> local arrayMove() immediately
  -> single backend reorder call with full ordered id list
  -> suppress drag refetch only during save
  -> on success: release guard
  -> on failure: restore prior order + toast
```

If you approve, I’ll implement exactly this narrow change set and keep the validation focused on reorder + dashboard preview only.