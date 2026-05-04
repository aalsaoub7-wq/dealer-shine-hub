
-- Batch reorder photos in a single call instead of one update per photo
CREATE OR REPLACE FUNCTION public.reorder_photos(photo_orders jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  photo_id uuid;
  new_order int;
  caller_company_id uuid;
BEGIN
  -- Get the caller's company
  SELECT company_id INTO caller_company_id
  FROM public.user_companies
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF caller_company_id IS NULL THEN
    RAISE EXCEPTION 'User does not belong to any company';
  END IF;

  -- Loop through each item and update display_order
  FOR item IN SELECT * FROM jsonb_array_elements(photo_orders)
  LOOP
    photo_id := (item->>'id')::uuid;
    new_order := (item->>'display_order')::int;

    UPDATE public.photos p
    SET display_order = new_order
    FROM public.cars c
    WHERE p.id = photo_id
      AND p.car_id = c.id
      AND c.company_id = caller_company_id;
  END LOOP;
END;
$$;
