-- Backfill admin roles for existing users who created their own companies
INSERT INTO public.user_roles (user_id, company_id, role)
SELECT uc.user_id, uc.company_id, 'admin'::app_role
FROM public.user_companies uc
LEFT JOIN public.user_roles ur ON uc.user_id = ur.user_id AND uc.company_id = ur.company_id
WHERE ur.id IS NULL;

-- Update trigger function to assign admin role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Create a new company for the user
  INSERT INTO public.companies (name)
  VALUES ('Company - ' || NEW.email)
  RETURNING id INTO new_company_id;
  
  -- Link user to the company
  INSERT INTO public.user_companies (user_id, company_id)
  VALUES (NEW.id, new_company_id);
  
  -- Assign admin role to the new user
  INSERT INTO public.user_roles (user_id, company_id, role)
  VALUES (NEW.id, new_company_id, 'admin');
  
  RETURN NEW;
END;
$$;