-- Drop and recreate public_shared_collections view WITHOUT user_id
DROP VIEW IF EXISTS public.public_shared_collections;

CREATE VIEW public.public_shared_collections AS
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