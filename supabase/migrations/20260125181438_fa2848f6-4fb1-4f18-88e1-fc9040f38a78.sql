-- Add column to track if photo has unused free regeneration
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS has_free_regeneration boolean DEFAULT false;

COMMENT ON COLUMN public.photos.has_free_regeneration IS 
  'True om bilden har en oanvänd gratis regenerering tillgänglig efter första redigeringen';