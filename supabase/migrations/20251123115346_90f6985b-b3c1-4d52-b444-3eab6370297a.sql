-- Add trial image tracking columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS trial_images_remaining integer DEFAULT 150,
ADD COLUMN IF NOT EXISTS trial_images_used integer DEFAULT 0;

-- Backfill existing companies with 150 trial images
UPDATE public.companies 
SET trial_images_remaining = 150, trial_images_used = 0 
WHERE trial_images_remaining IS NULL;

-- Create edge function to auto-create Stripe customer
-- This will be triggered when a new admin user is created