-- Add background_template_id column to ai_settings table
-- This stores which template is selected ("showroom", "luxury-studio", or NULL for custom)
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS background_template_id TEXT DEFAULT NULL;