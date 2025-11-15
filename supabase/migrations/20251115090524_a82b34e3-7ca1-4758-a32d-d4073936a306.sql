-- Remove old watermark_position column and add x, y coordinates
ALTER TABLE public.ai_settings
DROP COLUMN watermark_position,
ADD COLUMN watermark_x NUMERIC DEFAULT 20,
ADD COLUMN watermark_y NUMERIC DEFAULT 20;