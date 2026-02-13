
-- Add per-company credential columns to ai_settings
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS blocket_api_token text;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS blocket_dealer_code text;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS blocket_dealer_name text;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS blocket_dealer_phone text;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS blocket_dealer_email text;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS wayke_client_id text;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS wayke_client_secret text;
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS wayke_branch_id text;
