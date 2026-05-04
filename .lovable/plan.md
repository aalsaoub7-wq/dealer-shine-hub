
## Problem

Two issues identified:

1. **Drag-drop causes full reload flicker**: When you reorder photos by dragging, `handleDragEnd` updates each photo's `display_order` in the database. This triggers the realtime subscription (`postgres_changes` on `photos` table), which calls `fetchCarData(true)` after 500ms. That refetch resets the photos array, causing the gallery to re-render with "Laddar..." overlays on every image.

2. **Preview image on Dashboard**: The Dashboard already queries photos ordered by `display_order ASC` and picks the first one, so this should work correctly *after* the drag-drop reliably persists. The flickering/failed updates may be causing stale `display_order` values.

## Plan

### 1. Add a drag-in-progress flag to suppress realtime refetch (CarDetail.tsx)

- Add a `useRef` flag (`isDraggingRef`) that is set `true` during drag operations.
- Pass a new `onDragStart` and `onDragEnd` callback pair to `PhotoGalleryDraggable`.
- In the realtime subscription handler, skip the `fetchCarData` call when `isDraggingRef.current` is `true`.
- After the DB updates complete in `handleDragEnd`, wait briefly (~1s), then clear the flag — any realtime events that arrive after that will refetch normally.

### 2. Update PhotoGalleryDraggable to notify parent of drag lifecycle

- Accept optional `onDragStart` / `onReorderComplete` props.
- Call `onDragStart` when `DndContext` fires `onDragStart`.
- Call `onReorderComplete` after the DB updates in `handleDragEnd` succeed.
- This keeps the component's API clean and isolated.

### 3. Batch the display_order update into a single RPC or sequential approach

- Instead of `Promise.all` with individual updates (which fires N realtime events), keep the current approach but the suppression flag handles the noise.

### Files changed

| File | Change |
|------|--------|
| `src/pages/CarDetail.tsx` | Add `isDraggingRef`, pass drag callbacks, guard realtime handler |
| `src/components/PhotoGalleryDraggable.tsx` | Accept and call `onDragStart`/`onReorderComplete` props |

### Risk assessment

- **CarDetail.tsx**: Only the realtime handler gets a conditional guard. All other flows (upload, edit, watermark, delete) are unaffected since `isDraggingRef` is only true during active drag.
- **PhotoGalleryDraggable.tsx**: Two optional callback props added. No existing behavior changed. All other props and logic untouched.
- No database changes, no new tables, no edge function changes.
