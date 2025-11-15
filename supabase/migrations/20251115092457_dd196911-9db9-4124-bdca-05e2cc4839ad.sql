-- Add watermark opacity column to ai_settings
ALTER TABLE public.ai_settings
ADD COLUMN watermark_opacity NUMERIC DEFAULT 0.8 CHECK (watermark_opacity >= 0 AND watermark_opacity <= 1);