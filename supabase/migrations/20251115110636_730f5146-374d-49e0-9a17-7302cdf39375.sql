-- Add landing page customization fields to ai_settings
ALTER TABLE public.ai_settings
ADD COLUMN landing_page_logo_url text,
ADD COLUMN landing_page_background_color text DEFAULT '#ffffff',
ADD COLUMN landing_page_layout text DEFAULT 'grid' CHECK (landing_page_layout IN ('grid', 'carousel', 'masonry')),
ADD COLUMN landing_page_header_image_url text;

-- Create shared_collections table for sharing photo collections
CREATE TABLE public.shared_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  photo_ids text[] NOT NULL DEFAULT '{}',
  share_token text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.shared_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_collections
CREATE POLICY "Users can view their own shared collections"
ON public.shared_collections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shared collections"
ON public.shared_collections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared collections"
ON public.shared_collections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared collections"
ON public.shared_collections
FOR DELETE
USING (auth.uid() = user_id);

-- Public can view collections by share token (for landing page)
CREATE POLICY "Anyone can view shared collections by token"
ON public.shared_collections
FOR SELECT
USING (true);

-- Create index for faster lookups by share token
CREATE INDEX idx_shared_collections_share_token ON public.shared_collections(share_token);

-- Create function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  token text;
  exists boolean;
BEGIN
  LOOP
    -- Generate random 12 character token
    token := substr(md5(random()::text || clock_timestamp()::text), 1, 12);
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.shared_collections WHERE share_token = token) INTO exists;
    
    IF NOT exists THEN
      RETURN token;
    END IF;
  END LOOP;
END;
$$;