
# Billing Fix Plan for Joels Bil and All Customers

## Problem Summary

There are **three billing bugs** causing incorrect invoicing. Joels Bil's upcoming invoice of 773.70 kr is wrong for two compounding reasons:

1. Each image edit is billed at **5.95 kr instead of 5.00 kr** (automatic tax added)
2. Only **46 of ~80 actual edit events** reached Stripe (events are being lost)
3. A regeneration code path bypasses free regeneration logic (affects future customers)

---

## Issue 1: Tax Markup (5.95 kr instead of 5.00 kr)

**What's happening:** The Stripe price is correctly set to 500 ore (5.00 kr), but each pending invoice item shows 5.95 kr -- a 19% markup. This is caused by **Stripe Tax** being enabled on the account. When prices are created without an explicit `tax_behavior` setting (currently "unspecified"), Stripe treats them as tax-exclusive and adds tax on top.

- Expected metered cost: 46 x 5.00 = 230 kr
- Actual metered cost: 46 x 5.95 = 273.70 kr
- Overcharge: **43.70 kr**

**Affects:** All customers with metered billing (Joels Bil + Aram Carcenter + future customers).

**Fix:**
- Update `create-customer-checkout` edge function to set `tax_behavior: "inclusive"` on both the monthly and metered prices when creating them. This tells Stripe the stated price already includes any applicable tax.
- For Joels Bil specifically: you will need to either (a) disable Stripe Tax in the Stripe dashboard, or (b) create new replacement prices with `tax_behavior: "inclusive"` and swap the subscription items.

---

## Issue 2: Lost Billing Events (~42% failure rate)

**What's happening:** The app tracks 80 edit/regeneration events in the database (`usage_stats`), but only 46 meter events reached Stripe. **34 events were lost**, meaning Joels Bil is actually being *under-billed*.

```text
Expected flow:
  Client edits image
    -> Updates usage_stats in DB (always succeeds)
    -> Calls report-usage-to-stripe edge function (sometimes fails silently)
```

The core problem is that `usage_stats` is updated **before** Stripe reporting. If the edge function call fails (network timeout, browser closed, edge function error), the local count goes up but Stripe never receives the event. There is no retry mechanism.

**Affects:** All customers -- any failed edge function call means lost revenue.

**Fix:**
- Add a **retry mechanism** (up to 3 attempts with delay) in the `trackUsage` function for the Stripe reporting call
- Add detailed **logging** in the `report-usage-to-stripe` edge function for every success/failure
- Add a `stripe_reported` boolean column to `usage_stats` or a separate tracking mechanism to detect and reconcile missed events

---

## Issue 3: Regeneration Tracking Bug

**What's happening:** In `CarDetail.tsx` line 1010, the background regeneration function calls `trackUsage("edited_image")` directly instead of `trackRegenerationUsage(photoId, car!.id)`. This bypasses the "one free regeneration" policy.

- For Joels Bil: no impact (they always pay for regenerations)
- For other customers: they get charged for what should be a free first regeneration

**Affects:** Aram Carcenter and any future customers.

**Fix:** Change line 1010 from `trackUsage` to `trackRegenerationUsage`.

---

## Technical Changes

### 1. `supabase/functions/create-customer-checkout/index.ts`
Add `tax_behavior: "inclusive"` to both price creation calls:

```typescript
// Monthly price
const monthlyPrice = await stripe.prices.create({
  product: product.id,
  unit_amount: monthlyFee,
  currency: "sek",
  tax_behavior: "inclusive",  // NEW
  recurring: { interval: "month" },
  nickname: `${companyName} - Manadsavgift`,
});

// Metered price
const meteredPrice = await stripe.prices.create({
  product: product.id,
  unit_amount: pricePerImage,
  currency: "sek",
  tax_behavior: "inclusive",  // NEW
  recurring: {
    interval: "month",
    usage_type: "metered",
    meter: METER_ID,
  },
  nickname: `${companyName} - Per bild`,
});
```

### 2. `src/lib/usageTracking.ts`
Add retry logic for Stripe reporting:

```typescript
// Replace the single call with retry logic
const reportToStripeWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error: reportError } = await supabase.functions.invoke(
        "report-usage-to-stripe",
        { body: { quantity: 1 } }
      );
      if (reportError) {
        throw reportError;
      }
      console.log(`[USAGE] Stripe reporting succeeded on attempt ${attempt}`);
      return; // Success
    } catch (err) {
      console.error(`[USAGE] Stripe reporting attempt ${attempt}/${maxRetries} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt)); // Backoff
      }
    }
  }
  console.error("[USAGE] All Stripe reporting attempts failed!");
};

await reportToStripeWithRetry();
```

### 3. `src/pages/CarDetail.tsx` (line 1010)
Fix the regeneration tracking:

```typescript
// BEFORE (line 1008-1011):
await trackUsage("edited_image", car!.id);
analytics.imageRegenerated(car!.id);

// AFTER:
await trackRegenerationUsage(photoId, car!.id);
analytics.imageRegenerated(car!.id);
```

This requires adding `photoId` to the scope of this function call (it should already be available as a parameter of the regeneration handler).

### 4. `supabase/functions/report-usage-to-stripe/index.ts`
Add comprehensive logging for debugging:

```typescript
// Add at the start of the function
console.log(`[REPORT-USAGE] Function invoked at ${new Date().toISOString()}`);

// Add after successful meter event creation
console.log(`[REPORT-USAGE] SUCCESS: Meter event created for customer ${company.stripe_customer_id}, quantity: ${quantity}`);

// Add in catch blocks
console.log(`[REPORT-USAGE] FAILED: Could not report for customer ${company.stripe_customer_id}: ${error.message}`);
```

---

## Manual Steps Required (Stripe Dashboard)

1. **Check if Stripe Tax is enabled**: Go to Stripe Dashboard -> Settings -> Tax. If automatic tax collection is enabled, you need to decide whether to keep it or disable it.
2. **Fix Joels Bil's existing prices**: Since you cannot change `tax_behavior` on existing prices, you need to either:
   - Disable Stripe Tax entirely (simplest)
   - Create new prices with `tax_behavior: "inclusive"` and swap the subscription items
3. **Reconcile lost events**: The 34 missing events (34 x 5.00 = 170 kr) were not reported to Stripe. You may want to manually create invoice items for the missing amount, or accept the loss.
