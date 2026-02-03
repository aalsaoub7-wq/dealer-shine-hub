-- Add checkout_url column to signup_codes for storing the Stripe checkout link
ALTER TABLE signup_codes ADD COLUMN IF NOT EXISTS checkout_url text;