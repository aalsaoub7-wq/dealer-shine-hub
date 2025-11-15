-- Create table for pending photo edits
CREATE TABLE IF NOT EXISTS public.pending_photo_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  edited_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  complete_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.pending_photo_edits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view pending edits for their cars"
ON public.pending_photo_edits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.photos p
    JOIN public.cars c ON p.car_id = c.id
    WHERE p.id = pending_photo_edits.photo_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create pending edits for their cars"
ON public.pending_photo_edits
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.photos p
    JOIN public.cars c ON p.car_id = c.id
    WHERE p.id = pending_photo_edits.photo_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update pending edits for their cars"
ON public.pending_photo_edits
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.photos p
    JOIN public.cars c ON p.car_id = c.id
    WHERE p.id = pending_photo_edits.photo_id
    AND c.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_pending_edits_complete_at ON public.pending_photo_edits(complete_at) WHERE completed = false;