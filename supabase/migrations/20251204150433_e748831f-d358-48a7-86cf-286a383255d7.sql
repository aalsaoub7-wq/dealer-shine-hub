-- Lägg till RLS-policy för att låta användare se alla medlemmar i samma företag
CREATE POLICY "Users can view all members in their company"
ON public.user_companies
FOR SELECT
USING (
  company_id IN (
    SELECT uc.company_id 
    FROM public.user_companies uc 
    WHERE uc.user_id = auth.uid()
  )
);

-- Fixa korrupta trial_images_remaining värden (ska aldrig vara över 50)
UPDATE public.companies 
SET trial_images_remaining = LEAST(trial_images_remaining, 50)
WHERE trial_images_remaining > 50;