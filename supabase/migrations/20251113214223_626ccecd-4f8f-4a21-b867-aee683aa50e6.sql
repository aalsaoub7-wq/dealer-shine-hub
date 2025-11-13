-- Add display_order to photos table for drag-and-drop ordering
ALTER TABLE public.photos ADD COLUMN display_order integer DEFAULT 0;

-- Create companies table
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create user_companies junction table
CREATE TABLE public.user_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Enable RLS on user_companies
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Add company_id to cars table
ALTER TABLE public.cars ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update existing cars to have a company (create a default company for existing users)
DO $$
DECLARE
  default_company_id uuid;
BEGIN
  -- Create a default company
  INSERT INTO public.companies (name) VALUES ('Standard Företag') RETURNING id INTO default_company_id;
  
  -- Update all existing cars to belong to this company
  UPDATE public.cars SET company_id = default_company_id WHERE company_id IS NULL;
  
  -- Add all existing users to this company
  INSERT INTO public.user_companies (user_id, company_id)
  SELECT DISTINCT user_id, default_company_id FROM public.cars
  ON CONFLICT (user_id, company_id) DO NOTHING;
END $$;

-- Make company_id required for new cars
ALTER TABLE public.cars ALTER COLUMN company_id SET NOT NULL;

-- Create function to check if user belongs to a company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(company_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_companies
    WHERE user_id = auth.uid()
      AND company_id = company_uuid
  )
$$;

-- Update RLS policies for cars table
DROP POLICY IF EXISTS "Users can view their own cars" ON public.cars;
DROP POLICY IF EXISTS "Users can insert their own cars" ON public.cars;
DROP POLICY IF EXISTS "Users can update their own cars" ON public.cars;
DROP POLICY IF EXISTS "Users can delete their own cars" ON public.cars;

CREATE POLICY "Users can view cars in their company"
ON public.cars
FOR SELECT
USING (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can insert cars for their company"
ON public.cars
FOR INSERT
WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can update cars in their company"
ON public.cars
FOR UPDATE
USING (public.user_belongs_to_company(company_id));

CREATE POLICY "Users can delete cars in their company"
ON public.cars
FOR DELETE
USING (public.user_belongs_to_company(company_id));

-- Update RLS policies for photos table
DROP POLICY IF EXISTS "Users can view photos of their cars" ON public.photos;
DROP POLICY IF EXISTS "Users can insert photos for their cars" ON public.photos;
DROP POLICY IF EXISTS "Users can update photos of their cars" ON public.photos;
DROP POLICY IF EXISTS "Users can delete photos of their cars" ON public.photos;

CREATE POLICY "Users can view photos of their company's cars"
ON public.photos
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.cars
  WHERE cars.id = photos.car_id
    AND public.user_belongs_to_company(cars.company_id)
));

CREATE POLICY "Users can insert photos for their company's cars"
ON public.photos
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.cars
  WHERE cars.id = photos.car_id
    AND public.user_belongs_to_company(cars.company_id)
));

CREATE POLICY "Users can update photos of their company's cars"
ON public.photos
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.cars
  WHERE cars.id = photos.car_id
    AND public.user_belongs_to_company(cars.company_id)
));

CREATE POLICY "Users can delete photos of their company's cars"
ON public.photos
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.cars
  WHERE cars.id = photos.car_id
    AND public.user_belongs_to_company(cars.company_id)
));

-- RLS policies for companies table
CREATE POLICY "Users can view their companies"
ON public.companies
FOR SELECT
USING (public.user_belongs_to_company(id));

-- RLS policies for user_companies table
CREATE POLICY "Users can view their company memberships"
ON public.user_companies
FOR SELECT
USING (user_id = auth.uid());

-- Create trigger for updating updated_at on companies
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();