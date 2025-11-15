-- Change watermark_size to NUMERIC to accept decimal values
ALTER TABLE public.ai_settings
ALTER COLUMN watermark_size TYPE NUMERIC;