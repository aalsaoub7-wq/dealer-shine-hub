## Problem

You picked **Gemini 3 Pro Image (preview)** and got an empty response. The model didn't fail — image-generation models return their output as **image data**, not as `message.content` text. The current code only reads `data.choices[0].message.content` and ignores everything else, so it sets `text = ""` and you see nothing.

The Lovable AI Gateway returns generated images on the assistant message in one of these shapes (OpenAI-compatible):
- `choices[0].message.images: [{ image_url: { url: "data:image/png;base64,..." } }]`
- and/or content parts with `{ type: "image_url", image_url: { url: "..." } }`

## Fix (minimal, isolated to the Gemini Test tab)

**1. `supabase/functions/gemini-playground/index.ts`**
- Extract images from the assistant message in addition to text:
  - Collect URLs from `message.images[].image_url.url`
  - Also scan `message.content` if it's an array, picking `image_url` parts
- Return `{ text, images: string[], raw }` (keep `text` for backward compat, add `images`).
- No other logic changes; no auth/RLS/CORS changes.

**2. `src/components/admin/GeminiPlayground.tsx`**
- Add `responseImages: string[]` state alongside existing `response` text.
- After invoke, set `responseImages = data.images ?? []` and `response = data.text ?? ""`.
- Below the "Svar" text block, render a grid of returned images (`<img src={dataUrl} />`) with a small "Ladda ner"-link (`<a download href={...}>`) per image.
- If the response has neither text nor images, show a clear message (`"Modellen returnerade inget innehåll"`) so it's never silently blank again.

## Out of scope / untouched

- No changes to Admin.tsx, other tabs, billing, blocket-sync, wayke-sync, photo-edit flows, or any existing edge function.
- No DB / RLS / config.toml changes.
- No model list changes.

## Validation after implementation

- Build passes.
- `/admin` → "Gemini Test" tab still renders.
- Text model (e.g. `google/gemini-3-flash-preview`) → text response shows as before.
- Image model (`google/gemini-3-pro-image-preview`) with your prompt + uploaded car photo → returned image is shown and downloadable.
- Network tab: only `gemini-playground` is called; no other flow touched.
