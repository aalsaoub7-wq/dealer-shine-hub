-- Add column to track which background image was used for interior edits
-- NULL = solid color was used, URL = background image was used
ALTER TABLE public.photos ADD COLUMN interior_background_url TEXT;