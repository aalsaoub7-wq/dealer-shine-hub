-- Create secure views that exclude sensitive data for public access

-- View for shared collections without user_id exposure
CREATE OR REPLACE VIEW public.public_shared_collections AS
SELECT 
  id,
  share_token,
  photo_ids,
  created_at,
  expires_at,
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
FROM public.shared_collections;

-- View for photos without car_id exposure (only url and id)
CREATE OR REPLACE VIEW public.public_photos AS
SELECT 
  id,
  url
FROM public.photos;

-- RLS policies for views
ALTER VIEW public.public_shared_collections SET (security_invoker = on);
ALTER VIEW public.public_photos SET (security_invoker = on);

-- Add DELETE policy for ai_settings (only owner can delete)
CREATE POLICY "Users can delete their own AI settings"
ON public.ai_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Prevent ALL deletion of usage_stats for billing integrity
-- No DELETE policy = no one can delete (critical for billing)

-- Add policies for user_companies to prevent unauthorized modifications
CREATE POLICY "Only system can insert user companies"
ON public.user_companies
FOR INSERT
WITH CHECK (false); -- No direct inserts allowed, only via triggers

CREATE POLICY "Only system can update user companies"
ON public.user_companies
FOR UPDATE
USING (false); -- No updates allowed

CREATE POLICY "Only system can delete user companies"
ON public.user_companies
FOR DELETE
USING (false); -- No deletions allowed

-- Ensure companies table is properly locked down (already has only SELECT policy, which is correct)
-- Companies are created via trigger, so no INSERT/UPDATE/DELETE policies needed

-- Ensure subscriptions table cannot be modified by users (already correct - only SELECT policy exists)