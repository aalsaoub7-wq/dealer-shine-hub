-- Update handle_new_user_company trigger to skip company creation for employee signups
CREATE OR REPLACE FUNCTION public.handle_new_user_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Skip automatic company creation if this is an employee signup
  -- Employee signup is handled by Auth.tsx which links to existing company
  IF NEW.raw_user_meta_data->>'is_employee_signup' = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- Create a new company for admin users (normal signup without invite code)
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