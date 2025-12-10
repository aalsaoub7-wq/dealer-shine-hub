-- Tabell för att spåra verifieringsstatus per användare
CREATE TABLE public.user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  email_verification_code TEXT,
  email_code_expires_at TIMESTAMPTZ,
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT false,
  phone_verification_code TEXT,
  phone_code_expires_at TIMESTAMPTZ,
  registration_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabell för att spåra IP-adresser för admin-registreringar
CREATE TABLE public.admin_registration_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_registration_ips ENABLE ROW LEVEL SECURITY;

-- RLS policies - endast service role kan hantera dessa tabeller
CREATE POLICY "Only service role can manage user_verifications"
  ON public.user_verifications
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only service role can manage admin_registration_ips"
  ON public.admin_registration_ips
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Trigger för att uppdatera updated_at
CREATE TRIGGER update_user_verifications_updated_at
  BEFORE UPDATE ON public.user_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Funktion för att skapa user_verification när en ny användare skapas
CREATE OR REPLACE FUNCTION public.handle_new_user_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_verifications (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger som skapar user_verification för nya användare
CREATE TRIGGER on_auth_user_created_verification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_verification();