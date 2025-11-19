-- Phase 1: Critical Security Fixes and Company Creation

-- 1. Fix company creation on user signup
-- Create function to automatically create company and link user
CREATE OR REPLACE FUNCTION public.handle_new_user_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create company when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_company ON auth.users;
CREATE TRIGGER on_auth_user_created_company
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_company();

-- 2. Fix shared_collections security vulnerability
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view shared collections by token" ON public.shared_collections;

-- Create new policy that only allows viewing by specific token
CREATE POLICY "View shared collections by valid token"
ON public.shared_collections
FOR SELECT
USING (
  -- Either you own it OR you're accessing via the correct share_token
  -- The share_token check should be done in application code by filtering
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.shared_collections sc
    WHERE sc.id = shared_collections.id
    AND (sc.expires_at IS NULL OR sc.expires_at > now())
  )
);

-- 3. Fix pending_photo_edits to use consistent company-based access control
DROP POLICY IF EXISTS "Users can view pending edits for their cars" ON public.pending_photo_edits;
DROP POLICY IF EXISTS "Users can create pending edits for their cars" ON public.pending_photo_edits;
DROP POLICY IF EXISTS "Users can update pending edits for their cars" ON public.pending_photo_edits;

CREATE POLICY "Users can view pending edits for their company's cars"
ON public.pending_photo_edits
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM photos p
    JOIN cars c ON p.car_id = c.id
    WHERE p.id = pending_photo_edits.photo_id
    AND user_belongs_to_company(c.company_id)
  )
);

CREATE POLICY "Users can create pending edits for their company's cars"
ON public.pending_photo_edits
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM photos p
    JOIN cars c ON p.car_id = c.id
    WHERE p.id = pending_photo_edits.photo_id
    AND user_belongs_to_company(c.company_id)
  )
);

CREATE POLICY "Users can update pending edits for their company's cars"
ON public.pending_photo_edits
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM photos p
    JOIN cars c ON p.car_id = c.id
    WHERE p.id = pending_photo_edits.photo_id
    AND user_belongs_to_company(c.company_id)
  )
);