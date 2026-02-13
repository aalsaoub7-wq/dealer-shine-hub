
# Fix: Interior edited pictures getting mixed up

## Root Cause

Two issues contribute to interior photos getting mixed up:

**1. Missing photo ID in upload filenames (primary cause)**

When saving interior edits via color change or position adjustment, the upload filename is `interior-${Date.now()}.jpg` -- no photo ID. If two operations happen close together, they write to nearly identical paths and can overwrite each other. The batch interior edit flow correctly uses `interior-${photo.id}-${Date.now()}.jpg`, but the single-photo flows do not.

**2. Incomplete gallery sync comparison**

The `PhotoGalleryDraggable` component's internal `items` state syncs with the `photos` prop by comparing `id-url-is_processing`. It does not check `edit_type`, `has_watermark`, or `interior_background_url`, so these fields can become stale in the display.

## Changes (2 files, ~4 lines each)

### File 1: `src/pages/CarDetail.tsx`

**Line 1311** -- in `handleInteriorEditWithColorChange`:
```
// Before:
const fileName = `interior-${Date.now()}.jpg`;
// After:
const fileName = `interior-${photo.id}-${Date.now()}.jpg`;
```

**Line 1216** -- in `handlePositionEditorSave`:
```
// Before:
const fileName = `interior-${Date.now()}.jpg`;
// After:
const fileName = `interior-${photoId}-${Date.now()}.jpg`;
```

### File 2: `src/components/PhotoGalleryDraggable.tsx`

**Lines 180-181** -- sync comparison:
```
// Before:
const currentIds = items.map(i => `${i.id}-${i.url}-${i.is_processing}`).join(',');
const newIds = photos.map(p => `${p.id}-${p.url}-${p.is_processing}`).join(',');

// After:
const currentIds = items.map(i => `${i.id}-${i.url}-${i.is_processing}-${i.edit_type}-${i.has_watermark}-${i.interior_background_url}`).join(',');
const newIds = photos.map(p => `${p.id}-${p.url}-${p.is_processing}-${p.edit_type}-${p.has_watermark}-${p.interior_background_url}`).join(',');
```

## What does NOT change

- No new files or dependencies
- No schema or migration changes
- No changes to edge functions
- No changes to Auth, ProtectedRoute, or any other pages
- No changes to the interior editing logic flow
- Batch interior edit flow is already correct and untouched
- All existing users unaffected
