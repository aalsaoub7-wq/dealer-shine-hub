-- Drop the existing public_shared_collections view if it exists
DROP VIEW IF EXISTS public.public_shared_collections;

-- Create a secure view for shared collections that excludes user_id
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
  -- user_id is intentionally excluded for privacy
FROM public.shared_collections
WHERE share_token IS NOT NULL 
  AND (expires_at IS NULL OR expires_at > now());

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON public.public_shared_collections TO anon;
GRANT SELECT ON public.public_shared_collections TO authenticated;

-- Add comment explaining the security purpose
COMMENT ON VIEW public.public_shared_collections IS 'Secure view for public access to shared collections. Excludes user_id to prevent correlation attacks.';