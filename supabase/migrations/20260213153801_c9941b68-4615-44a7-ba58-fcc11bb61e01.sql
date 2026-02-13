
-- Create wayke_ad_sync table (mirrors blocket_ad_sync)
CREATE TABLE public.wayke_ad_sync (
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  source_id text NOT NULL,
  wayke_vehicle_id text,
  state text NOT NULL DEFAULT 'none',
  last_action text,
  last_action_state text,
  last_error text,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT wayke_ad_sync_pkey PRIMARY KEY (car_id)
);

-- Enable RLS
ALTER TABLE public.wayke_ad_sync ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as blocket_ad_sync)
CREATE POLICY "Users can view wayke sync for their company's cars"
ON public.wayke_ad_sync FOR SELECT
USING (EXISTS (SELECT 1 FROM cars WHERE cars.id = wayke_ad_sync.car_id AND user_belongs_to_company(cars.company_id)));

CREATE POLICY "Users can insert wayke sync for their company's cars"
ON public.wayke_ad_sync FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM cars WHERE cars.id = wayke_ad_sync.car_id AND user_belongs_to_company(cars.company_id)));

CREATE POLICY "Users can update wayke sync for their company's cars"
ON public.wayke_ad_sync FOR UPDATE
USING (EXISTS (SELECT 1 FROM cars WHERE cars.id = wayke_ad_sync.car_id AND user_belongs_to_company(cars.company_id)));

CREATE POLICY "Users can delete wayke sync for their company's cars"
ON public.wayke_ad_sync FOR DELETE
USING (EXISTS (SELECT 1 FROM cars WHERE cars.id = wayke_ad_sync.car_id AND user_belongs_to_company(cars.company_id)));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.wayke_ad_sync;
