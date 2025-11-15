-- Fix search_path for generate_share_token function
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token text;
  exists boolean;
BEGIN
  LOOP
    -- Generate random 12 character token
    token := substr(md5(random()::text || clock_timestamp()::text), 1, 12);
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.shared_collections WHERE share_token = token) INTO exists;
    
    IF NOT exists THEN
      RETURN token;
    END IF;
  END LOOP;
END;
$$;