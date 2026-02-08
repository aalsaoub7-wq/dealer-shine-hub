
-- Create billing_events table for durable event logging
CREATE TABLE public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  user_id UUID NOT NULL,
  photo_id UUID REFERENCES public.photos(id),
  car_id UUID REFERENCES public.cars(id),
  event_type TEXT NOT NULL DEFAULT 'edited_image',
  stripe_reported BOOLEAN NOT NULL DEFAULT false,
  stripe_reported_at TIMESTAMPTZ,
  stripe_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast reconciliation queries (unreported events)
CREATE INDEX idx_billing_events_unreported 
  ON public.billing_events(company_id, stripe_reported) 
  WHERE stripe_reported = false;

-- Index for period-based queries
CREATE INDEX idx_billing_events_created 
  ON public.billing_events(created_at);

-- Enable RLS
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- Users can insert billing events for their own company
CREATE POLICY "Users can insert billing events for their company"
  ON public.billing_events
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.user_belongs_to_company(company_id)
  );

-- Users can read their own billing events
CREATE POLICY "Users can read own billing events"
  ON public.billing_events
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update stripe_reported on their own events (for optimistic marking)
CREATE POLICY "Users can update own billing events"
  ON public.billing_events
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
