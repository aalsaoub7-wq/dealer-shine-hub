

# Complement reflection prompt with snow removal

## Current prompt
The prompt instructs Gemini to add a fading floor reflection while keeping everything else unchanged.

## Proposed change
Add one sentence to the prompt asking Gemini to also remove any snow visible on the tires/wheels of the car. The addition is minimal to avoid disrupting the existing behavior.

### New prompt (addition in bold context):

"This is a high-resolution professional car dealership photo (2560x1707 pixels, 3:2 aspect ratio). Add a subtle soft and fading mirror-like reflection of the vehicle on the polished showroom floor beneath it. **Also remove any snow or slush visible on the tires and wheels of the car so they look clean.** Keep all other elements unchanged - maintain the exact same car, background, lighting, and resolution. Only add the floor reflection effect. Output the image at the same 2K resolution. The mirror like reflection should be of only the bottom half of the car, and it should be FADING, so it looks natural. Meaning, the reflection at the beginning should be clear, and then fade the higher up it is on the car and it should be suitable with the ground. Fix this."

## File changed

| File | Change |
|------|--------|
| `supabase/functions/add-reflection/index.ts` | Insert one sentence into the prompt on line 66 |

## What stays the same
- All other logic in the edge function
- No database changes
- No frontend changes

