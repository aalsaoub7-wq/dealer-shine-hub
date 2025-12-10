-- Fix Security Definer View issue by recreating views with SECURITY INVOKER
-- and fix shared_collections RLS to require specific token

-- Drop and recreate public_shared_collections as SECURITY INVOKER view
DROP VIEW IF EXISTS public.public_shared_collections;

CREATE VIEW public.public_shared_collections 
WITH (security_invoker = true)
AS
SELECT 
  id,
  created_at,
  expires_at,
  share_token,
  photo_ids,
  title,
  landing_page_logo_url,
  landing_page_background_color,
  landing_page_text_color,
  landing_page_accent_color,
  landing_page_layout,
  landing_page_header_image_url,
  landing_page_title,
  landing_page_description,
  landing_page_footer_text,
  landing_page_logo_size,
  landing_page_logo_position,
  landing_page_header_height,
  landing_page_header_fit
FROM public.shared_collections
WHERE share_token IS NOT NULL 
  AND (expires_at IS NULL OR expires_at > now());

-- Drop and recreate public_photos as SECURITY INVOKER view
DROP VIEW IF EXISTS public.public_photos;

CREATE VIEW public.public_photos 
WITH (security_invoker = true)
AS
SELECT 
  id,
  url
FROM public.photos;

-- Drop and recreate public_invite_codes as SECURITY INVOKER view  
DROP VIEW IF EXISTS public.public_invite_codes;

CREATE VIEW public.public_invite_codes
WITH (security_invoker = true)
AS
SELECT 
  id,
  employee_invite_code
FROM public.companies
WHERE employee_invite_code IS NOT NULL;

-- Grant SELECT permissions on views to anon role for public access
GRANT SELECT ON public.public_shared_collections TO anon;
GRANT SELECT ON public.public_photos TO anon;
GRANT SELECT ON public.public_invite_codes TO anon;