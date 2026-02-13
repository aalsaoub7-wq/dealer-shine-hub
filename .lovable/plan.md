

# Fix: Make interior editing as reliable as AI redigera

## Gaps found by comparing `handleEditPhotos` (reliable) vs interior flows

### Gap 1: `handleInteriorEditWithColorChange` doesn't clear `interior_background_url`
When changing from a background-image interior edit to a solid-color edit, the old `interior_background_url` stays in the DB. Next time the user clicks "Edit" on that photo, the position editor loads the OLD background image instead of showing solid color mode. This is a direct cause of "mixed up" behavior.

**Fix** (line ~1332 in `CarDetail.tsx`):
```typescript
// Before:
.update({
  url: publicUrl,
  is_processing: false,
  edit_type: 'interior',
})

// After:
.update({
  url: publicUrl,
  is_processing: false,
  edit_type: 'interior',
  interior_background_url: null,  // Clear - solid color was used
})
```

### Gap 2: `handlePositionEditorSave` (interior path) doesn't set `is_edited: true`
AI redigera always sets `is_edited: true`. The interior position save skips it, so the photo may not show the "Redigerad"/"Interior" badge correctly after repositioning.

**Fix** (line ~1221 in `CarDetail.tsx`):
```typescript
// Before:
.update({ url: urlData.publicUrl, is_processing: false, edit_type: 'interior', interior_background_url: bgImageUrl || null })

// After:
.update({ url: urlData.publicUrl, is_edited: true, is_processing: false, edit_type: 'interior', interior_background_url: bgImageUrl || null })
```

## Summary

Two one-line additions in `CarDetail.tsx`. No new files, no schema changes, no edge function changes. Same error handling pattern already in place. These close the remaining gaps between interior and studio editing reliability.

