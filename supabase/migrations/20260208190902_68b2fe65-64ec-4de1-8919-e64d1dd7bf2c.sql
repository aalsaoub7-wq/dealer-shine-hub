-- Problem 1: Filter out signup codes where stripe_customer_id = 'pending'
-- This prevents customers from registering before payment is completed

CREATE OR REPLACE VIEW public.public_signup_codes AS
SELECT id, code, used_at IS NOT NULL as is_used, company_name
FROM public.signup_codes
WHERE stripe_customer_id != 'pending';