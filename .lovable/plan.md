
# Critical Billing Bugs Found -- Fix Plan

## Bug 1: DOUBLE-BILLING RISK (No Idempotency Keys)

This is the most dangerous bug. The system can bill a customer TWICE for the same image edit.

**How it happens:**
1. User edits an image
2. `billing_events` row inserted (id = `abc123`)
3. `report-usage-to-stripe` is called optimistically and creates a meter event in Stripe -- SUCCESS
4. `markBillingEventReported` tries to update the DB... but the browser closes, or the network hiccups
5. The `billing_events` row remains `stripe_reported = false`
6. Next reconciliation finds this unreported event and creates ANOTHER meter event in Stripe
7. **Result: 2 meter events for 1 edit = double billing**

**The fix:** Stripe's Meter Events API has an `identifier` parameter specifically for this. From the Stripe docs: *"Use idempotency keys to prevent reporting usage for each event more than one time. Every meter event corresponds to an identifier that you can specify in your request."* Stripe enforces uniqueness within 24 hours.

**Changes:**
- Pass the `billing_event_id` from the client to `report-usage-to-stripe`
- In `report-usage-to-stripe`: use it as `identifier` in `stripe.billing.meterEvents.create()`
- In `reconcile-usage`: use the `billing_event.id` as `identifier` in each meter event creation
- Both the optimistic call and the reconciliation will use the SAME identifier, so Stripe deduplicates automatically

---

## Bug 2: BACKFILL MODE WILL CAUSE OVERBILLING AGAIN

The backfill mode in `reconcile-usage` (lines 302-360) still uses the **Preview Invoice API** as its primary method to count existing Stripe events. This is the EXACT same code that caused the 80-event disaster -- it returned 0 because preview invoices don't include pending metered usage from Billing Meters.

The `listEventSummaries` fallback only runs if the Preview Invoice API *fails* (HTTP error). But the bug is that it *succeeds* with a response that shows 0 metered line items.

**The fix:** Replace the Preview Invoice API with `stripe.billing.meters.listEventSummaries()` as the PRIMARY and ONLY method. This API directly queries the meter for actual event counts.

---

## Bug 3: DASHBOARD RECONCILIATION RUNS FOR ALL COMPANIES

Every time ANY user loads their dashboard (line 89-91), `triggerReconciliation()` is called WITHOUT a `company_id`. This means the reconcile function processes ALL companies with every single dashboard load. Problems:
- Unnecessary Stripe API calls (rate limit risk)
- Every employee triggers reconciliation for ALL companies
- Wastes edge function execution time

**The fix:** Pass the user's `company_id` to `triggerReconciliation()` so it only reconciles the relevant company.

---

## Bug 4: CLIENT CAN SKIP BILLING (RLS Vulnerability)

The `billing_events` table has an UPDATE RLS policy that lets users update their own events. The `markBillingEventReported` function updates `stripe_reported = true` from the browser. A knowledgeable user could call this directly to mark all their billing events as reported without them ever reaching Stripe, effectively skipping billing.

**The fix:** Remove the UPDATE policy on `billing_events`. Only server-side code (reconcile function using service role) should be able to mark events as reported. The optimistic "mark as reported" should also move server-side -- `report-usage-to-stripe` should do the DB update itself after successfully creating the meter event.

---

## Technical Changes

### 1. `supabase/functions/report-usage-to-stripe/index.ts`

- Accept `billing_event_id` in the request body
- Pass it as `identifier` to `stripe.billing.meterEvents.create()`
- After successful meter event creation, update `billing_events` table to set `stripe_reported = true` using service role (server-side, not client-side)

```text
// Before:
body: { quantity: 1 }
stripe.billing.meterEvents.create({ event_name, payload, timestamp })

// After:
body: { quantity: 1, billing_event_id: "abc123" }
stripe.billing.meterEvents.create({ event_name, payload, timestamp, identifier: "abc123" })
// + server-side: UPDATE billing_events SET stripe_reported = true WHERE id = "abc123"
```

### 2. `supabase/functions/reconcile-usage/index.ts`

- **Backfill mode (lines 302-360)**: Replace Preview Invoice API with `listEventSummaries` as the ONLY method
- **Normal reconciliation (line 221-228)**: Add `identifier: event.id` to meter event creation
- Remove the `listEventSummaries` from being a "fallback" and make it the primary approach

### 3. `src/lib/usageTracking.ts`

- Pass `billingEventId` to `report-usage-to-stripe` edge function: `{ quantity: 1, billing_event_id: billingEventId }`
- Remove `markBillingEventReported` function (no longer needed -- server handles it)
- Remove the client-side "mark as reported" call from `reportToStripeOptimistic`
- Pass `company_id` from the loaded company data to `triggerReconciliation()` on dashboard load

### 4. `src/pages/Dashboard.tsx`

- Get user's `company_id` and pass it to `triggerReconciliation(companyId)`

### 5. Database migration

- Remove the UPDATE RLS policy on `billing_events` (only service role should update)

---

## Summary

| Bug | Severity | Fix |
|-----|----------|-----|
| No idempotency keys -- double billing possible | CRITICAL | Pass billing_event.id as `identifier` to Stripe |
| Backfill uses Preview Invoice API (returns 0) | CRITICAL | Switch to `listEventSummaries` |
| Dashboard reconciles ALL companies | MEDIUM | Pass user's company_id |
| Client can mark events as reported (skip billing) | MEDIUM | Remove UPDATE RLS policy, move to server-side |
