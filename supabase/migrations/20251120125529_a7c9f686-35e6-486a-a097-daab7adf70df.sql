-- Allow public read access to photos that are in shared collections
CREATE POLICY "Public can view photos in shared collections"
ON public.photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_collections sc
    WHERE sc.photo_ids @> ARRAY[photos.id::text]
    AND (sc.expires_at IS NULL OR sc.expires_at > now())
  )
);