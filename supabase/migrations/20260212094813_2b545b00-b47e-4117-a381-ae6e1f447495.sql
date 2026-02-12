
CREATE OR REPLACE FUNCTION public.handle_new_user_company()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_company_id uuid;
  invite_code_value text;
  signup_code_value text;
  signup_code_record record;
BEGIN
  -- Scenario 1: Signup with signup_code (new admin with pre-linked Stripe)
  signup_code_value := NEW.raw_user_meta_data->>'signup_code';
  
  IF signup_code_value IS NOT NULL THEN
    RAISE LOG '[TRIGGER handle_new_user_company] User % has signup_code: %', NEW.id, signup_code_value;
    
    SELECT * INTO signup_code_record
    FROM public.signup_codes
    WHERE code = signup_code_value AND used_at IS NULL
    LIMIT 1;
    
    IF FOUND THEN
      RAISE LOG '[TRIGGER handle_new_user_company] Found unused signup code for user %, creating company...', NEW.id;
      
      INSERT INTO public.companies (name, stripe_customer_id)
      VALUES (
        COALESCE(signup_code_record.company_name, 'Company - ' || NEW.email),
        signup_code_record.stripe_customer_id
      )
      RETURNING id INTO new_company_id;
      
      -- Nullify trial for paying customers (they already paid via Stripe)
      UPDATE public.companies 
      SET trial_end_date = NULL, trial_images_remaining = 0
      WHERE id = new_company_id;
      
      INSERT INTO public.user_companies (user_id, company_id)
      VALUES (NEW.id, new_company_id);
      
      INSERT INTO public.user_roles (user_id, company_id, role)
      VALUES (NEW.id, new_company_id, 'admin');
      
      UPDATE public.signup_codes
      SET used_at = now(), used_by = NEW.id
      WHERE id = signup_code_record.id;
      
      RAISE LOG '[TRIGGER handle_new_user_company] Company % created for user % (scenario 1: signup code)', new_company_id, NEW.id;
      RETURN NEW;
    ELSE
      RAISE LOG '[TRIGGER handle_new_user_company] Signup code % not found or already used for user %', signup_code_value, NEW.id;
    END IF;
  END IF;

  -- Scenario 2: Employee signup with invite code
  IF NEW.raw_user_meta_data->>'is_employee_signup' = 'true' THEN
    invite_code_value := NEW.raw_user_meta_data->>'invite_code';
    RAISE LOG '[TRIGGER handle_new_user_company] User % is employee signup with invite_code: %', NEW.id, invite_code_value;
    
    IF invite_code_value IS NOT NULL THEN
      SELECT id INTO new_company_id
      FROM public.companies
      WHERE employee_invite_code = invite_code_value
      LIMIT 1;
      
      IF FOUND THEN
        INSERT INTO public.user_companies (user_id, company_id)
        VALUES (NEW.id, new_company_id);
        
        INSERT INTO public.user_roles (user_id, company_id, role)
        VALUES (NEW.id, new_company_id, 'employee');
        
        RAISE LOG '[TRIGGER handle_new_user_company] User % linked to company % as employee (scenario 2)', NEW.id, new_company_id;
      ELSE
        RAISE LOG '[TRIGGER handle_new_user_company] Invite code % not found for user %', invite_code_value, NEW.id;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Scenario 3: No valid code = save as lead
  RAISE LOG '[TRIGGER handle_new_user_company] User % has no valid code, saving as lead (scenario 3)', NEW.id;
  INSERT INTO public.leads (email)
  VALUES (NEW.email)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$function$;
