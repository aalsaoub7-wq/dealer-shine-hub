

# Enable Wayke API Integration -- Send Images to Wayke

## Overview

Add Wayke as a working sync destination alongside Blocket, following the exact same UI patterns and code structure. Users will be able to select photos and send them to Wayke directly from the app.

## Wayke API Key Differences from Blocket

- **Authentication**: OAuth2 client credentials flow (client_id + client_secret -> JWT token from `https://auth.wayke.se/connect/token`), NOT a static API key
- **Base URLs**: `dealer-api.wayke.se` for vehicle operations, `api.wayke.se/media/v2` for image uploads
- **Branch ID**: Required UUID identifying the dealer's branch in Wayke
- **Image handling**: Two-step process: 1) Upload image by URL via `/media/v2/image-url`, 2) Link to vehicle via `ad.media[].fileUrls[]` in vehicle create/patch

## Required Secrets (3 new)

Before implementation works, you'll need to provide:
1. **WAYKE_CLIENT_ID** -- OAuth2 client ID (obtained from Wayke at info@wayke.se)
2. **WAYKE_CLIENT_SECRET** -- OAuth2 client secret (obtained from Wayke)
3. **WAYKE_BRANCH_ID** -- Your branch UUID in Wayke (obtained from Wayke)

## Changes

### 1. `src/components/PlatformSyncDialog.tsx`
- Set Wayke `comingSoon: false` (line 36)
- Add Wayke image picker state and handlers (same pattern as Blocket image picker)
- Use `getOptimizedImageUrl` with `loading="lazy"` and `decoding="async"` on **both** Blocket and Wayke image pickers for smooth loading
- Import and call a new `useWaykeSync` hook
- Show Wayke sync status badges (same pattern as Blocket)

### 2. New file: `src/hooks/useWaykeSync.ts`
- Copy of `useBlocketSync.ts` adapted for Wayke
- Calls `syncCarToWayke` / `getWaykeStatus` / `subscribeToWaykeStatus` from a new `src/lib/wayke.ts`
- Same toast patterns, same validation (make, model, year, price required)

### 3. New file: `src/lib/wayke.ts`
- Copy of `src/lib/blocket.ts` adapted for Wayke
- `syncCarToWayke(carId, imageUrls)` -- invokes `wayke-sync` edge function
- `getWaykeStatus(carId)` -- reads from `wayke_ad_sync` table
- `subscribeToWaykeStatus(carId, callback)` -- realtime subscription on `wayke_ad_sync`
- `validateCarForWayke(car)` -- same required fields as Blocket

### 4. New database table: `wayke_ad_sync`
- Same schema as `blocket_ad_sync` but with `wayke_vehicle_id` instead of `blocket_ad_id`
- Columns: `car_id`, `source_id`, `wayke_vehicle_id`, `state`, `last_action`, `last_action_state`, `last_error`, `last_synced_at`, `created_at`, `updated_at`
- RLS policies: same pattern as `blocket_ad_sync` (company-scoped via cars table join)

### 5. New edge function: `supabase/functions/wayke-sync/index.ts`
- Same structure as `blocket-sync/index.ts` (CORS, auth check, car access check)
- Reads `carId` and `imageUrls` from request body
- Calls `WaykeSyncService.syncCar(carId, imageUrls)`

### 6. New file: `supabase/functions/_shared/wayke/waykeClient.ts`
- OAuth2 token acquisition: `POST https://auth.wayke.se/connect/token` with `client_id`, `client_secret`, `grant_type=client_credentials`, `scope=api-resource`
- Token caching (reuse until expired)
- Vehicle API calls:
  - `createVehicle(branchId, payload)` -- `POST https://dealer-api.wayke.se/vehicle`
  - `updateVehicle(waykeId, payload)` -- `PATCH https://dealer-api.wayke.se/vehicle/{id}`
  - `getVehicle(waykeId)` -- `GET https://dealer-api.wayke.se/vehicle/{id}/ad`
  - `updateVehicleStatus(waykeId, status)` -- `PUT https://dealer-api.wayke.se/vehicle/{id}/ad/status`
  - `uploadImageByUrl(url, branchId, waykeId, sortOrder)` -- `POST https://api.wayke.se/media/v2/image-url`

### 7. New file: `supabase/functions/_shared/wayke/waykeSyncService.ts`
- Same structure as `blocketSyncService.ts`
- `syncCar(carId, imageUrls)`:
  1. Fetch car from DB
  2. Check if vehicle exists in Wayke (via `wayke_ad_sync` table)
  3. If new: create vehicle, then upload images by URL, save sync record
  4. If existing: update vehicle with new images
  5. If deleted: set status to "Deleted" on Wayke
- `mapCarToWaykePayload(car, imageUrls)` -- maps car data to Wayke's vehicle format:
  - `branch`: branchId from env
  - `marketCode`: "SE"
  - `status`: "Published"
  - `vehicle`: `{registrationNumber, vin, mileage}`
  - `ad`: `{price, shortDescription, description, media: [{fileUrls: imageUrls}]}`

### 8. New file: `supabase/functions/_shared/wayke/waykeTypes.ts`
- Type definitions for `WaykeAdSync` (mirrors `BlocketAdSync`)

### 9. `supabase/config.toml`
- Add `[functions.wayke-sync]` with `verify_jwt = true`

## What does NOT change

- No changes to CarDetail.tsx
- No changes to interior/AI editing flows
- No changes to auth, routing, or any other page
- No changes to Blocket integration code
- No changes to any existing component except PlatformSyncDialog.tsx
- No changes to database schema of existing tables

## Flow after implementation

```text
User clicks "Synka" on car detail page
  -> PlatformSyncDialog opens
  -> User checks "Wayke" checkbox
  -> User clicks "Synka"
  -> Image picker appears (smooth loading with optimized URLs)
  -> User selects photos
  -> User clicks "Skicka till Wayke"
  -> syncToWayke(car, selectedUrls) called
  -> wayke-sync edge function authenticates via OAuth2
  -> Creates/updates vehicle on Wayke with images in ad.media
  -> Status saved to wayke_ad_sync table
  -> UI updates via realtime subscription
```

