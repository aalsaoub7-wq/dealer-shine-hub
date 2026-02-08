
# Bulletproof Automated Billing System

## Root Cause

The current system reports billing events from the **browser** (client-side). This is fundamentally unreliable -- if the user closes their tab, loses network, or the browser times out, the event is recorded in the database but never reaches Stripe. The retry logic helps with transient errors but cannot fix the "browser closed" scenario.

## Design Principle

**The database is the single source of truth.** Every billable action already writes to the `usage_stats` table (a reliable database operation). The system should use this as a **billing queue** and guarantee that every recorded event eventually reaches Stripe -- regardless of what happens on the client.

## Architecture

```text
Current (broken):
  Browser edits image
    -> DB: usage_stats +1          (reliable)
    -> Browser calls Stripe edge fn (unreliable -- browser can close!)
    -> Lost event = lost revenue

New (bulletproof):
  Browser edits image
    -> DB: billing_events INSERT   (reliable -- just a DB row)
    -> DB: usage_stats +1          (reliable)  
    -> Browser tries Stripe call   (optimistic -- best effort)
    -> If success: mark event as reported
    -> If fail: no problem!

  Safety net (automatic, server-side):
    -> On every dashboard/app load: reconcile function runs
    -> Stripe webhook "invoice.upcoming": reconcile before billing
    -> Admin panel: manual reconcile button (emergency only)
    
  Reconcile function (server-side):
    -> Counts billing_events WHERE stripe_reported = false
    -> Reports each one to Stripe
    -> Marks as reported
    -> 100% server-to-server = no browser dependency
```

## Technical Changes

### 1. New database table: `billing_events`

A durable event log where every billable action is recorded. This replaces the fragile "fire and forget" Stripe call as the primary billing mechanism.

```sql
CREATE TABLE public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL,
  photo_id UUID REFERENCES photos(id),
  car_id UUID REFERENCES cars(id),
  event_type TEXT NOT NULL DEFAULT 'edited_image',
  stripe_reported BOOLEAN NOT NULL DEFAULT false,
  stripe_reported_at TIMESTAMPTZ,
  stripe_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast reconciliation queries
CREATE INDEX idx_billing_events_unreported 
  ON billing_events(company_id, stripe_reported) 
  WHERE stripe_reported = false;

-- Index for period-based queries
CREATE INDEX idx_billing_events_created 
  ON billing_events(created_at);
```

RLS policies will ensure users can only insert events for their own company and cannot modify `stripe_reported` (only the server can do that via service role).

### 2. Update `src/lib/usageTracking.ts`

Change the flow so that:
1. Insert a row into `billing_events` first (this is the durable record)
2. Then update `usage_stats` as before (for the dashboard display)
3. Then try to report to Stripe (optimistic, best-effort)
4. If Stripe succeeds, update `billing_events.stripe_reported = true`

The key insight: even if steps 3-4 fail completely, the billing event is safely in the database and will be picked up by the reconciliation function.

### 3. New edge function: `reconcile-usage`

A server-side function that:
1. Queries `billing_events WHERE stripe_reported = false` for a given company (or all companies)
2. Groups them and reports to Stripe via the Meter Events API
3. Marks each event as `stripe_reported = true`
4. Returns a detailed report

This function runs entirely server-to-server (edge function to Stripe API) -- no browser involved, so it cannot fail due to client issues.

It accepts:
- `company_id` (optional) -- reconcile a specific company, or all companies if omitted
- `dry_run` (optional) -- just report what would be reconciled without actually doing it

### 4. Automatic reconciliation triggers

The reconciliation runs automatically in three ways:

**a) On app load (Dashboard component):**
When any user opens the dashboard, a lightweight call to `reconcile-usage` runs for their company. This catches any missed events from their previous session within seconds of their next login.

**b) Stripe webhook `invoice.upcoming`:**
Stripe sends this event ~3 days before an invoice finalizes. The webhook handler will call `reconcile-usage` for the relevant customer, ensuring all events are reported before billing closes. This is the ultimate safety net -- even if no user logs in for a month, the reconciliation happens before billing.

**c) Admin panel button (emergency only):**
A "Reconcile Billing" button in the admin panel that can manually trigger reconciliation for any or all companies. This is the fallback you should never need to use.

### 5. Update `stripe-webhook` to handle `invoice.upcoming`

Add a new case to the existing webhook handler:

```text
case "invoice.upcoming":
  -> Extract customer ID from invoice
  -> Find company by stripe_customer_id
  -> Call reconcile-usage for that company
  -> Log results
```

This requires adding `invoice.upcoming` to the webhook event subscriptions in the Stripe Dashboard.

### 6. Backfill Joels Bil's missing events

After deploying, the reconciliation function will be called for Joels Bil. But since we're introducing `billing_events` now and the old events were never logged there, we need a one-time backfill:

1. The reconciliation function has a special `backfill` mode
2. It compares `usage_stats.edited_images_count` vs Stripe meter event summaries
3. If DB total > Stripe total, it creates the missing meter events
4. This runs once for Joels Bil to fix the 34 missing events (~170 kr)

After this one-time fix, all future events flow through `billing_events` and the reconciliation just checks `stripe_reported = false`.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | `billing_events` table + indexes + RLS |
| `src/lib/usageTracking.ts` | Modify | Insert into `billing_events`, optimistic Stripe call, mark as reported |
| `supabase/functions/reconcile-usage/index.ts` | Create | Server-side reconciliation + backfill logic |
| `supabase/functions/stripe-webhook/index.ts` | Modify | Add `invoice.upcoming` handler |
| `src/pages/Dashboard.tsx` | Modify | Auto-reconcile on load |
| `src/pages/Admin.tsx` | Modify | Add manual reconcile button |
| `supabase/config.toml` | Modify | Register `reconcile-usage` function |

## Why This Is Low Risk

1. **Additive only** -- We add a new table and function; existing billing flow is enhanced, not replaced
2. **Idempotent** -- Reconciliation checks what is already reported and only fills gaps
3. **No double-billing** -- Each `billing_events` row is a unique event with a unique ID; `stripe_reported` flag prevents re-reporting
4. **Graceful degradation** -- If the reconciliation function itself fails, the next trigger point (app load, webhook, admin) will catch it
5. **Three layers of safety** -- Client-side optimistic report, auto-reconcile on app load, and Stripe webhook before invoicing

## Manual Step Required (One-Time)

After deployment, you need to add `invoice.upcoming` to your Stripe webhook event subscriptions in the Stripe Dashboard (Developers > Webhooks > your endpoint > Add events). This enables the pre-invoice reconciliation trigger.
