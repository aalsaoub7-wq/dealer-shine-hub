-- Update usage_stats table to reflect new pricing model
-- Remove add_car tracking fields and update edited images to be per car

ALTER TABLE usage_stats 
DROP COLUMN IF EXISTS added_cars_count,
DROP COLUMN IF EXISTS added_cars_cost;

-- Rename edited_images to cars_with_edited_images to reflect per-car pricing
ALTER TABLE usage_stats 
RENAME COLUMN edited_images_count TO cars_with_edited_images_count;

ALTER TABLE usage_stats 
RENAME COLUMN edited_images_cost TO cars_with_edited_images_cost;

-- Drop the pending_photo_edits table as we no longer need delayed processing
DROP TABLE IF EXISTS pending_photo_edits;