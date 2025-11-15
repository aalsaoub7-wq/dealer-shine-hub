-- Add logo and header image customization options
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS landing_page_logo_size text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS landing_page_logo_position text DEFAULT 'center',
ADD COLUMN IF NOT EXISTS landing_page_header_height text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS landing_page_header_fit text DEFAULT 'cover';