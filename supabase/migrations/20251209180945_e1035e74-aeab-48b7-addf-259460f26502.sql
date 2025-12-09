-- Drop and recreate the view without SECURITY DEFINER
-- Using SECURITY INVOKER (default) is safer as it uses the querying user's permissions
DROP VIEW IF EXISTS public.public_invite_codes;

CREATE VIEW public.public_invite_codes 
WITH (security_invoker = true)
AS
SELECT id, employee_invite_code
FROM companies
WHERE employee_invite_code IS NOT NULL;

-- Grant SELECT on the view to anon and authenticated roles for invite code validation
GRANT SELECT ON public.public_invite_codes TO anon, authenticated;