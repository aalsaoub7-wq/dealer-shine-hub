

# Fix: Bulletproof company creation on signup + restore Gnosjo Bil O Marin

## What went wrong
When joel@gbm.nu signed up with code `GNOSJ-OLOW`, the database trigger `handle_new_user_company` should have created the company automatically. It didn't -- the user ended up as a "lead" instead. The safety net (self-healing in get-billing-info) also didn't recover the situation, causing the user to see "Nagot gick fel".

## Three changes -- all minimal and isolated

### 1. Fix data for Gnosjo Bil O Marin (SQL operations, no schema changes)
Run SQL to manually create the missing records:
- Create company "Gnosjo Bil O Marin" linked to Stripe customer `cus_TxZZM5IPJigsYX`
- Link user joel@gbm.nu as admin
- Create local subscription record matching the active Stripe subscription
- Mark signup code as used
- Remove from leads table

### 2. Harden the database trigger (migration -- function replacement only)
Replace `handle_new_user_company` with two improvements:

**a) Use `IF FOUND` instead of `IF signup_code_record IS NOT NULL`**
The canonical PL/pgSQL way to check if `SELECT INTO` returned a row. More reliable than null-checking a RECORD variable.

**b) Add `RAISE LOG` statements**
Log which scenario the trigger enters, so if it ever fails again we can see exactly what happened in the database logs.

No structural changes to the trigger logic -- same scenarios, same order, same behavior. Just the check pattern and logging.

### 3. Harden the self-healing in get-billing-info (edge function)
Wrap the `auth.admin.getUser()` call in a try-catch so that if it throws (network issue, timeout), the error is caught and logged instead of crashing the entire function.

Currently (line 72):
```
const { data: { user: adminUser } } = await supabaseClient.auth.admin.getUser(user.id);
```

If this throws, the entire function returns 500 and the user sees "Nagot gick fel" with no recovery.

Change to:
```
let adminUser = null;
try {
  const { data } = await supabaseClient.auth.admin.getUser(user.id);
  adminUser = data?.user;
} catch (err) {
  console.error("[BILLING-INFO] Self-healing: failed to get user via admin API", err);
}
```

This way, if the admin API call fails, it falls through gracefully and throws the normal "No company found" error, which ProtectedRoute handles with the retry/ConnectionErrorScreen flow.

## What does NOT change
- No new files
- No new dependencies
- No schema changes (only function replacement)
- Desktop and mobile experience unchanged
- All existing users unaffected
- No changes to Auth.tsx, ProtectedRoute.tsx, or any frontend code
- Trigger logic flow is identical -- same 3 scenarios, same order
