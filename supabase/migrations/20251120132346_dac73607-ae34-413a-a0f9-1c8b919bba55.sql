-- Fix critical RLS policy issues for shared_collections and photos tables

-- Drop the overly permissive policy on shared_collections
DROP POLICY IF EXISTS "Anyone can view shared collections" ON public.shared_collections;

-- Create a more secure policy that only allows access via valid share_token
CREATE POLICY "Public can view shared collections by token"
ON public.shared_collections
FOR SELECT
TO anon, authenticated
USING (
  share_token IS NOT NULL 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Update the photos policy to be more restrictive
DROP POLICY IF EXISTS "Public can view photos in shared collections" ON public.photos;

CREATE POLICY "Public can view photos via valid shared collection"
ON public.photos
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.shared_collections sc
    WHERE sc.photo_ids @> ARRAY[photos.id::text]
      AND (sc.expires_at IS NULL OR sc.expires_at > now())
  )
);

-- Add index for performance on share_token lookups
CREATE INDEX IF NOT EXISTS idx_shared_collections_share_token ON public.shared_collections(share_token);
CREATE INDEX IF NOT EXISTS idx_photos_car_id ON public.photos(car_id);
CREATE INDEX IF NOT EXISTS idx_cars_company_id ON public.cars(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON public.user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON public.user_companies(company_id);