-- Update thumbnail URLs to point to Supabase Storage
-- First, we need to upload the images to storage, then update the URLs
-- For now, update the URLs to use the Supabase Storage path format
-- The images will be served from Supabase's CDN for faster loading

UPDATE background_templates 
SET thumbnail_url = 'https://abepwxatllszoapfmccl.supabase.co/storage/v1/object/public/car-photos/backgrounds/thumbnails/studio-background-thumb.jpg'
WHERE template_id = 'showroom';

UPDATE background_templates 
SET thumbnail_url = 'https://abepwxatllszoapfmccl.supabase.co/storage/v1/object/public/car-photos/backgrounds/thumbnails/dark-studio-thumb.jpg'
WHERE template_id = 'dark-studio';

UPDATE background_templates 
SET thumbnail_url = 'https://abepwxatllszoapfmccl.supabase.co/storage/v1/object/public/car-photos/backgrounds/thumbnails/gallery-thumb.jpg'
WHERE template_id = 'gallery';

UPDATE background_templates 
SET thumbnail_url = 'https://abepwxatllszoapfmccl.supabase.co/storage/v1/object/public/car-photos/backgrounds/thumbnails/curved-studio-thumb.jpg'
WHERE template_id = 'curved-studio';

UPDATE background_templates 
SET thumbnail_url = 'https://abepwxatllszoapfmccl.supabase.co/storage/v1/object/public/car-photos/backgrounds/thumbnails/ceiling-lights-thumb.jpg'
WHERE template_id = 'ceiling-lights';

UPDATE background_templates 
SET thumbnail_url = 'https://abepwxatllszoapfmccl.supabase.co/storage/v1/object/public/car-photos/backgrounds/thumbnails/panel-wall-thumb.jpg'
WHERE template_id = 'panel-wall';

UPDATE background_templates 
SET thumbnail_url = 'https://abepwxatllszoapfmccl.supabase.co/storage/v1/object/public/car-photos/backgrounds/thumbnails/dark-walls-light-floor-thumb.jpg'
WHERE template_id = 'dark-walls-light-floor';

UPDATE background_templates 
SET thumbnail_url = 'https://abepwxatllszoapfmccl.supabase.co/storage/v1/object/public/car-photos/backgrounds/thumbnails/concrete-showroom-thumb.jpg'
WHERE template_id = 'concrete-showroom';

UPDATE background_templates 
SET thumbnail_url = 'https://abepwxatllszoapfmccl.supabase.co/storage/v1/object/public/car-photos/backgrounds/thumbnails/spotlight-studio-thumb.jpg'
WHERE template_id = 'spotlight-studio';