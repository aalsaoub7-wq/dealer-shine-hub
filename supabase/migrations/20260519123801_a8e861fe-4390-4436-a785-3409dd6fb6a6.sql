ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_photo_type_check;
ALTER TABLE public.photos ADD CONSTRAINT photos_photo_type_check CHECK (photo_type IN ('main', 'documentation', 'damage'));