

# Fix: Blocket/Bytbil Sync Verification

## Issues Found

After comparing the codebase against the official Pro Import API v3 documentation, the integration is **mostly correct** but has **one critical bug** and a few minor issues:

### Critical Bug: Manual sync blocked by `publish_on_blocket` flag

In `blocketSyncService.ts` line 109, `syncCar()` checks `car.publish_on_blocket && !car.deleted_at`. If this flag is `false`, the sync **silently does nothing** (or tries to delete the ad). When users manually sync via the PlatformSyncDialog, they expect it to work regardless of this flag. The memory even states "Manual syncs bypass automatic sync flags" -- but the code doesn't actually bypass it.

**Fix**: Pass a `forceSync` boolean from the edge function when `imageUrls` are provided (manual sync always sends images), and skip the `publish_on_blocket` check when `forceSync` is true.

### Minor Issues (also fixing)

1. **`price` field sent as `undefined` when no price**: The API docs say `price` is **required**. Currently if `car.price` is null, `price` is `undefined` in the payload, which will cause an API validation error. Fix: always include price, default to empty array or 0.

2. **Validation mismatch**: `validateCarForBlocket` in `src/lib/blocket.ts` requires `price`, but the backend `mapCarToBlocketPayload` sends `undefined` if no price. These are consistent but the API will reject it. The frontend validation catches this, so this is a safety net only.

## Changes

### File 1: `supabase/functions/blocket-sync/index.ts`
- Pass `forceSync: true` when manually triggered (i.e., when imageUrls are provided in the request body)

### File 2: `supabase/functions/_shared/blocket/blocketSyncService.ts`
- Add `forceSync?: boolean` parameter to `syncCar()`
- When `forceSync` is true, skip the `publish_on_blocket` check and always create/update
- Fix `price` to always be an array (use `[]` if no price, though frontend validation should prevent this)

### No frontend changes needed
The frontend code correctly passes image URLs and calls the right functions. Bytbil correctly reuses the Blocket sync path.

## Risk Assessment
Very low. Two isolated backend changes:
- Adding a boolean parameter with a default of `false` (backward compatible)
- Ensuring price is always an array (defensive fix)

