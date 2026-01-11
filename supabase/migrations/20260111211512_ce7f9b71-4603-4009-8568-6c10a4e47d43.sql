-- Add watermark tracking columns to photos table
ALTER TABLE photos 
ADD COLUMN has_watermark boolean DEFAULT false,
ADD COLUMN watermark_x numeric,
ADD COLUMN watermark_y numeric,
ADD COLUMN watermark_size numeric,
ADD COLUMN watermark_opacity numeric,
ADD COLUMN pre_watermark_url text;