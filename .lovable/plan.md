

# Per-Company Credentials for Blocket & Wayke

## Problem

Currently, Blocket uses global `BLOCKET_API_TOKEN` / `BLOCKET_DEALER_CODE` etc. from environment secrets, and Wayke uses global `WAYKE_CLIENT_ID` / `WAYKE_CLIENT_SECRET` / `WAYKE_BRANCH_ID`. But each company/user has their own credentials -- these need to be stored per-company in the database and entered once via a smooth setup form.

## Solution

Store platform credentials in the `ai_settings` table (already has per-company CRUD with RLS). Add a one-time settings form that appears when a user first tries to sync to Blocket or Wayke and their credentials are missing.

## Changes

### 1. Database migration -- Add credential columns to `ai_settings`

Add 7 new nullable text columns:

- `blocket_api_token` -- JWT auth token for Blocket API
- `blocket_dealer_code` -- Dealer code from Blocket
- `blocket_dealer_name` -- Contact name
- `blocket_dealer_phone` -- Contact phone
- `blocket_dealer_email` -- Contact email
- `wayke_client_id` -- OAuth2 client ID for Wayke
- `wayke_client_secret` -- OAuth2 client secret for Wayke
- `wayke_branch_id` -- Branch UUID for Wayke

### 2. `src/components/PlatformSyncDialog.tsx`

Add a credentials setup form that appears **before** the image picker when credentials are missing:

- On clicking "Synka" with Blocket selected, check if `ai_settings` has `blocket_api_token` and `blocket_dealer_code` set
- If missing, show a form with fields: API-token, Dealer-kod, Kontaktnamn, Telefon, E-post
- User fills in once, saves to `ai_settings`, then proceeds to image picker
- Same pattern for Wayke: check `wayke_client_id`, `wayke_client_secret`, `wayke_branch_id`
- If missing, show Wayke setup form, save, then proceed to image picker
- Once saved, credentials are remembered and the form never appears again

Fetch `ai_settings` for the car's company on dialog open.

### 3. `src/lib/blocket.ts` and `src/lib/wayke.ts`

Update `syncCarToBlocket` and `syncCarToWayke` to also pass the `companyId` to the edge function so it can look up credentials.

### 4. `supabase/functions/blocket-sync/index.ts`

- Read `companyId` from request body (already have it from car lookup)
- Fetch `ai_settings` for that company using service role client
- Extract `blocket_api_token`, `blocket_dealer_code`, etc.
- Pass credentials to `BlocketSyncService.syncCar`

### 5. `supabase/functions/_shared/blocket/blocketSyncService.ts`

- Accept credentials object in `syncCar` and `mapCarToBlocketPayload`
- Use per-company credentials instead of `Deno.env.get()`
- Fall back to env vars if DB values are empty (backwards compatible)

### 6. `supabase/functions/_shared/blocket/blocketClient.ts`

- Modify `blocketFetch` to accept a token parameter instead of always reading from env
- Or add a method that accepts a token override

### 7. `supabase/functions/wayke-sync/index.ts`

- Fetch `ai_settings` for the car's company
- Extract `wayke_client_id`, `wayke_client_secret`, `wayke_branch_id`
- Pass to `WaykeSyncService.syncCar`

### 8. `supabase/functions/_shared/wayke/waykeSyncService.ts`

- Accept credentials object in `syncCar` and `mapCarToWaykePayload`
- Use per-company credentials instead of `Deno.env.get()`

### 9. `supabase/functions/_shared/wayke/waykeClient.ts`

- Modify `getAccessToken` and `waykeFetch` to accept credential parameters instead of always reading from env
- Token caching keyed by client_id to support multiple companies

## What does NOT change

- No changes to CarDetail.tsx or any other page
- No changes to interior/AI editing flows
- No changes to auth, routing, database RLS policies
- No changes to any component besides PlatformSyncDialog.tsx
- Existing global env secrets still work as fallback
- Social media sharing flow unchanged
- All other platforms remain "Kommer snart"

## UX Flow

```text
First time:
  User clicks "Synka" -> selects Blocket -> clicks "Synka"
  -> Settings form appears (5 fields for Blocket)
  -> User fills in credentials from Blocket support
  -> Clicks "Spara och fortsatt"
  -> Credentials saved to ai_settings
  -> Image picker appears as normal
  -> Sync proceeds with saved credentials

Subsequent times:
  User clicks "Synka" -> selects Blocket -> clicks "Synka"
  -> Image picker appears directly (credentials already saved)
  -> Sync uses saved credentials
```

Same pattern for Wayke (3 fields: Client ID, Client Secret, Branch ID).

