-- Add more customization options to ai_settings table
ALTER TABLE public.ai_settings
ADD COLUMN IF NOT EXISTS landing_page_text_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS landing_page_accent_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS landing_page_title text DEFAULT 'Mina Bilder',
ADD COLUMN IF NOT EXISTS landing_page_description text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS landing_page_footer_text text DEFAULT NULL;