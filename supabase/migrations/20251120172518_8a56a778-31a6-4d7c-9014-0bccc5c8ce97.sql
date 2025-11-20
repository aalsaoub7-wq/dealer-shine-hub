-- Drop and recreate the trigger function to handle both admin and employee signups
DROP FUNCTION IF EXISTS public.handle_new_user_company() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
  invite_code_value text;
BEGIN
  -- Check if this is an employee signup
  IF NEW.raw_user_meta_data->>'is_employee_signup' = 'true' THEN
    -- Get the invite code from metadata
    invite_code_value := NEW.raw_user_meta_data->>'invite_code';
    
    IF invite_code_value IS NOT NULL THEN
      -- Find the company with this invite code
      SELECT id INTO new_company_id
      FROM public.companies
      WHERE employee_invite_code = invite_code_value
      LIMIT 1;
      
      IF new_company_id IS NOT NULL THEN
        -- Link user to the existing company
        INSERT INTO public.user_companies (user_id, company_id)
        VALUES (NEW.id, new_company_id);
        
        -- Assign employee role
        INSERT INTO public.user_roles (user_id, company_id, role)
        VALUES (NEW.id, new_company_id, 'employee');
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Normal admin signup - create a new company
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created_company
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_company();