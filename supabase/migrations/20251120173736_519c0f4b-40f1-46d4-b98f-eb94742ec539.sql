-- Add company_id column to ai_settings table
ALTER TABLE public.ai_settings 
ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- Populate company_id for existing rows
UPDATE public.ai_settings 
SET company_id = (
  SELECT company_id 
  FROM public.user_companies 
  WHERE user_companies.user_id = ai_settings.user_id 
  LIMIT 1
);

-- Make company_id NOT NULL now that we've populated it
ALTER TABLE public.ai_settings 
ALTER COLUMN company_id SET NOT NULL;

-- Drop the unique constraint on user_id (we need to allow the constraint to be dropped)
ALTER TABLE public.ai_settings 
DROP CONSTRAINT IF EXISTS ai_settings_user_id_key;

-- Add unique constraint on company_id
ALTER TABLE public.ai_settings 
ADD CONSTRAINT ai_settings_company_id_key UNIQUE (company_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view their own AI settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Users can insert their own AI settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Users can update their own AI settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Users can delete their own AI settings" ON public.ai_settings;

-- Create new RLS policies based on company_id
CREATE POLICY "Users can view their company AI settings" 
ON public.ai_settings 
FOR SELECT 
USING (user_belongs_to_company(company_id));

CREATE POLICY "Users can insert their company AI settings" 
ON public.ai_settings 
FOR INSERT 
WITH CHECK (user_belongs_to_company(company_id));

CREATE POLICY "Users can update their company AI settings" 
ON public.ai_settings 
FOR UPDATE 
USING (user_belongs_to_company(company_id));

CREATE POLICY "Users can delete their company AI settings" 
ON public.ai_settings 
FOR DELETE 
USING (user_belongs_to_company(company_id));