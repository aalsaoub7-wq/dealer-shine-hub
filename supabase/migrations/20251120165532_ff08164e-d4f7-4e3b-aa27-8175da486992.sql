-- Tillåt oautentiserade användare att läsa employee_invite_code för validering vid signup
CREATE POLICY "Public can validate invite codes"
ON public.companies
FOR SELECT
TO anon
USING (true);