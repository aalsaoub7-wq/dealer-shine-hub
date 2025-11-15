-- Add watermark position and size settings to ai_settings
ALTER TABLE public.ai_settings
ADD COLUMN watermark_position TEXT DEFAULT 'top-left',
ADD COLUMN watermark_size INTEGER DEFAULT 15;