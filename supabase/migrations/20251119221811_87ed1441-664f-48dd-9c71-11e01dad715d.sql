-- Update usage_stats table to track individual edited images instead of cars with edited images
ALTER TABLE usage_stats 
  DROP COLUMN IF EXISTS generated_descriptions_count,
  DROP COLUMN IF EXISTS generated_descriptions_cost,
  DROP COLUMN IF EXISTS cars_with_edited_images_count,
  DROP COLUMN IF EXISTS cars_with_edited_images_cost;

ALTER TABLE usage_stats
  ADD COLUMN IF NOT EXISTS edited_images_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edited_images_cost numeric NOT NULL DEFAULT 0;

-- Update total_cost calculation to only include edited images
UPDATE usage_stats 
SET total_cost = edited_images_cost;