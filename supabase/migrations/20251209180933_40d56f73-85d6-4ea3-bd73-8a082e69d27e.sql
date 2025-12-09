-- Create a secure view for public invite code validation
-- This only exposes the invite code itself, not other company data
CREATE OR REPLACE VIEW public.public_invite_codes AS
SELECT id, employee_invite_code
FROM companies
WHERE employee_invite_code IS NOT NULL;

-- Drop the overly permissive policy that exposes ALL company data
DROP POLICY IF EXISTS "Public can validate invite codes" ON public.companies;

-- Create a function to validate invite codes without exposing company data
CREATE OR REPLACE FUNCTION public.validate_invite_code(code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.companies
  WHERE employee_invite_code = code
  LIMIT 1
$$;