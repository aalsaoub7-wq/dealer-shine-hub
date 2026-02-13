

# Connect Blocket API -- Make Image Sync Work

## Current State

The codebase already has a full Blocket integration skeleton:
- `blocketClient.ts` -- HTTP wrapper for Blocket Pro Import API v3 (correct base URL, auth header)
- `blocketSyncService.ts` -- Sync logic (create/update/delete ads, status tracking)
- `blocketTypes.ts` -- TypeScript types
- `blocket-sync` edge function -- Authenticated endpoint
- `PlatformSyncDialog` -- UI dialog (but Blocket is marked `comingSoon: true`)
- `useBlocketSync` hook -- State management
- `blocket_ad_sync` table -- Status tracking (already exists)
- `BLOCKET_API_TOKEN` secret -- Already configured

## What's Broken (3 issues)

### Issue 1: Blocket is disabled in the UI
In `PlatformSyncDialog.tsx` line 34, Blocket has `comingSoon: true`. This means:
- Users can't check the Blocket checkbox
- "Valj alla" skips it (only selects non-comingSoon platforms)
- The sync button is effectively dead for Blocket

**Fix**: Set `comingSoon: false` for Blocket (one field change).

### Issue 2: No image selection for Blocket
When users click "Synka", the dialog sends the car data but doesn't let users choose which photos to send. The `handleSync` calls `syncToBlocket(car)` which uses `car.image_urls` from the cars table -- but the actual edited photos live in the `photos` table with public URLs.

**Fix**: Add an image selection step (like the existing social media picker) that appears after selecting Blocket and clicking Synka. Selected image URLs are passed to `syncToBlocket`.

### Issue 3: Photos not sent to Blocket API
`mapCarToBlocketPayload` in `blocketSyncService.ts` uses `car.image_urls` (line 108), but that field on the cars table may be empty or stale. The real photo URLs come from the `photos` table.

**Fix**: The edge function `blocket-sync` will fetch selected photo URLs from the request body (sent by the frontend) and pass them directly into the Blocket payload, bypassing `car.image_urls`.

## Changes (3 files, minimal)

### File 1: `src/components/PlatformSyncDialog.tsx`
- Change Blocket from `comingSoon: true` to `comingSoon: false` (line 34)
- Add a Blocket image picker view (reuse the same pattern as the existing social media picker on lines 102-163)
- When user selects Blocket and clicks "Synka", show image grid from the `photos` prop
- On confirm, call `syncToBlocket(car, selectedImageUrls)` with the chosen URLs

### File 2: `src/hooks/useBlocketSync.ts`
- Update `syncToBlocket` signature to accept optional `imageUrls: string[]`
- Pass `imageUrls` in the edge function body: `{ carId, imageUrls }`

### File 3: `supabase/functions/blocket-sync/index.ts`
- Read `imageUrls` from request body
- Pass them to `BlocketSyncService.syncCar(carId, imageUrls)`

### File 4: `supabase/functions/_shared/blocket/blocketSyncService.ts`
- Accept `imageUrls` parameter in `syncCar` and pass through to `mapCarToBlocketPayload`
- In `mapCarToBlocketPayload`, prefer the passed `imageUrls` over `car.image_urls`

## What does NOT change

- No new database tables or migrations
- No new dependencies
- No changes to CarDetail.tsx
- No changes to auth, routing, or any other page
- No changes to the interior/AI editing flows
- No changes to BlocketClient.ts (API wrapper is already correct per the docs)
- No changes to blocketTypes.ts
- Social media picker flow unchanged
- All other platforms remain "Kommer snart"

## Technical Details

### Blocket API image_urls field (from docs)
- Array of strings (public URLs to JPG/PNG)
- Maximum 38 images
- The API downloads images from provided URLs asynchronously

Since car photos are in a public Supabase storage bucket (`car-photos`, `is_public: true`), the URLs are already publicly accessible and Blocket can fetch them directly.

### Flow after fix

```text
User clicks "Synka" on car detail page
  -> PlatformSyncDialog opens (platform list)
  -> User checks "Blocket" checkbox
  -> User clicks "Synka" button
  -> Image picker appears (shows main photos)
  -> User selects photos to send
  -> User clicks "Skicka till Blocket"
  -> syncToBlocket(car, selectedUrls) called
  -> Edge function receives carId + imageUrls
  -> BlocketSyncService builds payload with those URLs
  -> BlocketClient.createAd/updateAd sends to Blocket API
  -> Status saved to blocket_ad_sync table
  -> UI updates via realtime subscription
```

