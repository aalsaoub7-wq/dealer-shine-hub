-- Add plan column to subscriptions table
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan text DEFAULT 'start';

-- Update trial images remaining default to 50
ALTER TABLE public.companies ALTER COLUMN trial_images_remaining SET DEFAULT 50;

-- Update existing trial users who haven't used any images to have 50 remaining
UPDATE public.companies 
SET trial_images_remaining = 50 
WHERE trial_images_used = 0 
AND trial_images_remaining = 150;