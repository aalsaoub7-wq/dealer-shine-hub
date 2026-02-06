
-- Fix Aram Carcenter: trigger failed silently, manually do what it should have done

DO $$
DECLARE
  new_company_id uuid;
  aram_user_id uuid := 'a77ac3e4-8778-4d26-bab3-5773cfe53231';
  aram_signup_code_id uuid;
BEGIN
  -- 1. Create company with Stripe link
  INSERT INTO public.companies (name, stripe_customer_id, trial_end_date, trial_images_remaining)
  VALUES ('Aram Carcenter', 'cus_TvibGYdOz13dJV', NULL, 0)
  RETURNING id INTO new_company_id;

  -- 2. Link user to company
  INSERT INTO public.user_companies (user_id, company_id)
  VALUES (aram_user_id, new_company_id);

  -- 3. Give admin role
  INSERT INTO public.user_roles (user_id, company_id, role)
  VALUES (aram_user_id, new_company_id, 'admin');

  -- 4. Mark signup code as used
  UPDATE public.signup_codes
  SET used_at = now(), used_by = aram_user_id
  WHERE code = 'ARAMC-M4DJ' AND used_at IS NULL;

  -- 5. Remove lead entry
  DELETE FROM public.leads WHERE email = 'info@carcenterlidkoping.se';
END $$;
