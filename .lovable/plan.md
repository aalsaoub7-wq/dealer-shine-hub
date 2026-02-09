

# Add subtle reflection removal to the prompt

## Change

Add one sentence to the existing prompt in `supabase/functions/add-reflection/index.ts` (line 66) instructing Gemini to subtly reduce any unwanted reflections on the car body without altering anything else.

### Updated prompt (new addition highlighted):

"...Also remove any snow or slush visible on the tires and wheels of the car so they look clean. **Subtly reduce any unwanted reflections visible on the car body paint, but do not alter the car's color, shape, or any other details.** Keep all other elements unchanged..."

## File changed

| File | Change |
|------|--------|
| `supabase/functions/add-reflection/index.ts` | Insert one sentence into the prompt on line 66 |

## What stays the same
- All other logic, database, frontend unchanged

