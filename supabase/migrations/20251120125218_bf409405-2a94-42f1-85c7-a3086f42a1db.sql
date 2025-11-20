-- Add landing page settings columns to shared_collections table
ALTER TABLE public.shared_collections
ADD COLUMN landing_page_logo_url text,
ADD COLUMN landing_page_background_color text DEFAULT '#ffffff',
ADD COLUMN landing_page_layout text DEFAULT 'grid',
ADD COLUMN landing_page_header_image_url text,
ADD COLUMN landing_page_text_color text DEFAULT '#000000',
ADD COLUMN landing_page_accent_color text DEFAULT '#000000',
ADD COLUMN landing_page_title text DEFAULT 'Mina Bilder',
ADD COLUMN landing_page_description text,
ADD COLUMN landing_page_footer_text text,
ADD COLUMN landing_page_logo_size text DEFAULT 'medium',
ADD COLUMN landing_page_logo_position text DEFAULT 'center',
ADD COLUMN landing_page_header_height text DEFAULT 'medium',
ADD COLUMN landing_page_header_fit text DEFAULT 'cover';