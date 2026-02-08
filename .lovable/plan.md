

# Bulletproof: Ta bort ALL trial-logik och fixa default

## Vad som behover fixas

Jag har hittat **4 kvarvarande problem** som maste atgardas for att systemet ska vara helt skottssakert:

### 1. Databasdefault: `trial_images_remaining` ar fortfarande 50

Kolumnen `trial_images_remaining` har DEFAULT 50 i databasen. Om nagon kodvag skapar ett foretag utan att explicit satta detta till 0, far de 50 "gratis" bilder i systemet.

**Fix:** Databasmigration som andrar default till 0.

### 2. Trial-logik i usageTracking.ts kan ge gratis redigering

Rad 141-164 i `usageTracking.ts` kollar `isInTrial` och om det ar sant, anropar `track-trial-usage` och returnerar UTAN att rapportera till Stripe. Idag ar `isInTrial` alltid `false` (alla `trial_end_date = NULL`), men om nagon av misstag satter ett datum sa far kunden gratis bilder.

**Fix:** Ta bort hela trial-blocket (rad 141-164) och ta bort `trial_end_date`/`trial_images_remaining`/`trial_images_used` fran queryn. Varje redigering ska ALLTID ga till Stripe.

### 3. Trial-UI kvar i Dashboard, CarDetail och PaymentSettings

Alla tre filer har kvarvarande trial-relaterad UI och state:
- **Dashboard.tsx**: `trialInfo` state, `checkTrialStatus()`, trial-banner (rad 258-273)
- **CarDetail.tsx**: `trialInfo` state (rad 118-124), trial-limiter i `handleEditPhotos` (rad 564-565), `handleInteriorEdit` (rad 748)
- **PaymentSettings.tsx**: Trial-interface (rad 26-32), "Testperiod Aktiv"-kort (rad 236-263), trial-villkor i kostnadsvisning (rad 307-311, 317-318, 342-343, 397-398, 406-407)

**Fix:** Ta bort all trial-relaterad state, UI och logik fran alla tre filer.

### 4. get-billing-info returnerar trial-objekt och "Provperiod" fallback

Edge-funktionen returnerar fortfarande ett `trial`-objekt i responsen (rad 280-286, 421-427) och anvander "Provperiod" som fallback-plannamn (rad 261).

**Fix:**
- Ta bort `trial`-objektet fran bada response-grenarna
- Ta bort trial-berakning (rad 156-163)
- Ta bort `trial_end_date`/`trial_images_remaining`/`trial_images_used` fran company-queryn
- Andra fallback-plannamn fran "Provperiod" till "Inget abonnemang"

### Bonus: Ta bort track-trial-usage edge function

`supabase/functions/track-trial-usage/index.ts` ar helt overflodigt nar trial-logiken ar borta. Tas bort for att undvika forvirring.

---

## Tekniska andringar

| Fil | Andring |
|-----|---------|
| Databasmigration | `ALTER TABLE companies ALTER COLUMN trial_images_remaining SET DEFAULT 0` |
| `src/lib/usageTracking.ts` | Ta bort rad 141-164 (isInTrial-blocket), ta bort trial-kolumner fran company-queryn |
| `src/pages/Dashboard.tsx` | Ta bort `trialInfo` state, `checkTrialStatus()`, trial-banner |
| `src/pages/CarDetail.tsx` | Ta bort `trialInfo` state, ta bort trial-check i `handleEditPhotos` och `handleInteriorEdit` |
| `src/components/PaymentSettings.tsx` | Ta bort trial-interface, trial-kort, trial-villkor i kostnadsvisning |
| `supabase/functions/get-billing-info/index.ts` | Ta bort trial-berakning, trial-objekt fran respons, andra fallback till "Inget abonnemang" |
| `supabase/functions/track-trial-usage/index.ts` | Radera helt |
| `supabase/config.toml` | Ta bort `[functions.track-trial-usage]` |

## Vad som INTE andras

- `handle_new_user_company`-triggern (den sattar redan `trial_end_date = NULL` och `trial_images_remaining = 0`)
- Self-healing i `get-billing-info` (den sattar redan `trial_end_date: null, trial_images_remaining: 0`)
- `ProtectedRoute.tsx` (den anvander inte trial-logik langre, den kollar bara `hasPaymentMethod` och `hasActiveSubscription`)
- `TrialExpiredPaywall.tsx` (den visar redan "Konto ej aktiverat" utan trial-text)
- Stripe-koppling och billingflode (inga andringar)

