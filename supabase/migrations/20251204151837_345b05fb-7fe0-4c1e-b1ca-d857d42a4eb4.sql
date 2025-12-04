-- Ta bort den felaktiga policyn som orsakar rekursion
DROP POLICY IF EXISTS "Users can view all members in their company" ON public.user_companies;

-- Skapa SECURITY DEFINER-funktion för att hämta company_id utan RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.user_companies
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Skapa ny RLS-policy som använder funktionen (ingen rekursion)
CREATE POLICY "Users can view all members in their company"
ON public.user_companies
FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
);