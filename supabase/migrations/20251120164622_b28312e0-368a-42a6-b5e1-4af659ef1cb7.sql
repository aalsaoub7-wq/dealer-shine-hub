
-- Add permanent employee invite code to companies table
ALTER TABLE public.companies 
ADD COLUMN employee_invite_code TEXT UNIQUE;

-- Generate initial codes for existing companies
UPDATE public.companies 
SET employee_invite_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE employee_invite_code IS NULL;

-- Drop the old invite_codes table as it's no longer needed
DROP TABLE IF EXISTS public.invite_codes;

-- Create RLS policy for admins to view and update employee_invite_code
CREATE POLICY "Admins can view their company's invite code"
ON public.companies
FOR SELECT
USING (
  is_company_admin(auth.uid(), id)
);

CREATE POLICY "Admins can update their company's invite code"
ON public.companies
FOR UPDATE
USING (
  is_company_admin(auth.uid(), id)
);
