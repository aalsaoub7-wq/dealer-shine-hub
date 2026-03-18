

# Fix: Photos in queue get reset by watchdog before processing starts

## Root Cause

When a user selects 15 photos and clicks "AI-redigera":

1. **Lines 606-611**: ALL 15 photos are immediately marked `is_processing: true` in the database
2. **Lines 743-747**: Only 2 concurrent workers start (`MAX_CONCURRENT = 2`)
3. Each photo takes ~60-150 seconds to process (segment + composite + reflection)
4. **Lines 240-242**: A watchdog runs every 10 seconds
5. **Line 177**: The watchdog resets any photo with `is_processing: true` and `updated_at` older than **90 seconds**
6. Photos 3-15 are waiting in the in-memory queue. After 90 seconds, the watchdog resets them to `is_processing: false` because no worker has "touched" their `updated_at` yet
7. The worker's "touch" at line 631-635 only happens when a worker **picks up** the photo, which for photo #15 could be 15+ minutes later

**Result**: Photos get reset, error toasts fire ("Vår AI fick för många bollar att jonglera"), and the user sees photos flip back to un-processing state. The workers DO eventually re-mark and process them, but the UX is broken and users often navigate away thinking it failed.

## Fix (minimal, isolated)

**Single change in `src/pages/CarDetail.tsx`**: Move the initial `is_processing: true` marking from the upfront loop (lines 606-611) into the worker's `processNext` function. The "touch" at line 631-635 already does exactly this -- so we just **remove lines 606-611**.

This means:
- Photos are only marked `is_processing: true` when a worker actually starts processing them
- The watchdog will never reset queued photos because they aren't marked as processing yet
- Photos 3-15 won't show spinners until a worker picks them up, but they WILL get processed reliably

### Before (current):
```
// Mark ALL photos as processing upfront  ← PROBLEM
for (const photo of photosToProcess) {
  await supabase.from("photos").update({ is_processing: true }).eq("id", photo.id);
}
// ... later, workers pick up photos one by one
```

### After (fix):
```
// Remove upfront marking entirely
// Workers already mark photos via the "touch" at line 631-635
```

## What does NOT change
- Worker logic, queue, concurrency limit -- untouched
- Watchdog timer -- untouched
- Safety timeout -- untouched
- All other functionality -- untouched
- Interior editing, regeneration, position editor -- untouched

## Risk Assessment
**Extremely low**. Removing 5 lines that do redundant work (the worker already sets `is_processing: true` before starting). No new code added.

