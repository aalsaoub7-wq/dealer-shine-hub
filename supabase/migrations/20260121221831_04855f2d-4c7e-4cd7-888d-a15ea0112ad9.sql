-- Create signup_codes table for admin onboarding with pre-linked Stripe customers
CREATE TABLE public.signup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  company_name TEXT,
  used_at TIMESTAMPTZ,
  used_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS - only service role can manage
ALTER TABLE public.signup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can manage signup_codes" 
  ON public.signup_codes FOR ALL 
  USING (false) WITH CHECK (false);

-- Create public view for code validation (before signup)
CREATE VIEW public.public_signup_codes AS
SELECT id, code, used_at IS NOT NULL as is_used, company_name
FROM public.signup_codes;

-- Grant read access to the view for validation
GRANT SELECT ON public.public_signup_codes TO anon, authenticated;

-- Update handle_new_user_company function to support signup_code
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
    -- Find the signup code
    SELECT * INTO signup_code_record
    FROM public.signup_codes
    WHERE code = signup_code_value AND used_at IS NULL
    LIMIT 1;
    
    IF signup_code_record IS NOT NULL THEN
      -- Create new company with pre-linked stripe_customer_id
      INSERT INTO public.companies (name, stripe_customer_id)
      VALUES (
        COALESCE(signup_code_record.company_name, 'Company - ' || NEW.email),
        signup_code_record.stripe_customer_id
      )
      RETURNING id INTO new_company_id;
      
      -- Link user to the company
      INSERT INTO public.user_companies (user_id, company_id)
      VALUES (NEW.id, new_company_id);
      
      -- Assign admin role
      INSERT INTO public.user_roles (user_id, company_id, role)
      VALUES (NEW.id, new_company_id, 'admin');
      
      -- Mark code as used
      UPDATE public.signup_codes
      SET used_at = now(), used_by = NEW.id
      WHERE id = signup_code_record.id;
      
      RETURN NEW;
    END IF;
  END IF;

  -- Scenario 2: Employee signup with invite code (existing system)
  IF NEW.raw_user_meta_data->>'is_employee_signup' = 'true' THEN
    invite_code_value := NEW.raw_user_meta_data->>'invite_code';
    
    IF invite_code_value IS NOT NULL THEN
      SELECT id INTO new_company_id
      FROM public.companies
      WHERE employee_invite_code = invite_code_value
      LIMIT 1;
      
      IF new_company_id IS NOT NULL THEN
        INSERT INTO public.user_companies (user_id, company_id)
        VALUES (NEW.id, new_company_id);
        
        INSERT INTO public.user_roles (user_id, company_id, role)
        VALUES (NEW.id, new_company_id, 'employee');
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Scenario 3: Normal admin signup (creates trial company)
  INSERT INTO public.companies (name)
  VALUES ('Company - ' || NEW.email)
  RETURNING id INTO new_company_id;
  
  INSERT INTO public.user_companies (user_id, company_id)
  VALUES (NEW.id, new_company_id);
  
  INSERT INTO public.user_roles (user_id, company_id, role)
  VALUES (NEW.id, new_company_id, 'admin');
  
  RETURN NEW;
END;
$function$;