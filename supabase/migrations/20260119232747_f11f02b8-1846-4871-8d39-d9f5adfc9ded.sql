-- Add interior color history to ai_settings
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS interior_color_history text[] DEFAULT '{}';

-- Add edit_type to photos to distinguish between studio and interior edits
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS edit_type text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.photos.edit_type IS 'Type of edit: studio (AI edit with background), interior (solid color background), NULL (unedited)';