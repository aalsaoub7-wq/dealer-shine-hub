-- Fix CRITICAL: Password reset tokens accessible without authentication
-- Revoke all access from anon and authenticated roles - only service_role should access this table
REVOKE ALL ON public.password_reset_tokens FROM anon;
REVOKE ALL ON public.password_reset_tokens FROM authenticated;

-- Invalidate all existing tokens as they may have been compromised
DELETE FROM public.password_reset_tokens;

-- Fix CRITICAL: User email addresses accessible without authentication
-- Revoke all access from anon role - authenticated users will still be controlled by RLS
REVOKE ALL ON public.profiles FROM anon;

-- Add comments explaining the security restrictions
COMMENT ON TABLE public.password_reset_tokens IS 'Password reset tokens - RESTRICTED ACCESS: Only service_role can access this table. Edge functions use service_role key.';
COMMENT ON TABLE public.profiles IS 'User profiles - RESTRICTED ACCESS: No anonymous access. Authenticated users controlled by RLS policies.';