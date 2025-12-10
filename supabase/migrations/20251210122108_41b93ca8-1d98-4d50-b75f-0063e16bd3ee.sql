-- Unique constraint: only one verified phone number allowed across all users
CREATE UNIQUE INDEX unique_verified_phone 
ON public.user_verifications (phone_number) 
WHERE phone_verified = true AND phone_number IS NOT NULL;