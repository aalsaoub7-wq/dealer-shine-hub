-- Add logo_url field to ai_settings table
ALTER TABLE public.ai_settings 
ADD COLUMN logo_url TEXT;