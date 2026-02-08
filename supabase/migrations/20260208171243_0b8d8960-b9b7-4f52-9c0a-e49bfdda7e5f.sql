-- Remove UPDATE RLS policy on billing_events
-- Only server-side (service role) should be able to mark events as reported
DROP POLICY IF EXISTS "Users can update own billing events" ON public.billing_events;