-- Add custom_background_seed column to ai_settings for storing custom prompt seeds
ALTER TABLE public.ai_settings 
ADD COLUMN custom_background_seed text;