-- Lägg till nödvändiga kolumner i cars-tabellen för Blocket-integration
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS price integer,
ADD COLUMN IF NOT EXISTS registration_number text,
ADD COLUMN IF NOT EXISTS fuel text,
ADD COLUMN IF NOT EXISTS gearbox text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS publish_on_blocket boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Skapa blocket_ad_sync-tabellen för att spåra synkstatus
CREATE TABLE IF NOT EXISTS public.blocket_ad_sync (
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  source_id text NOT NULL,
  blocket_ad_id text,
  blocket_store_id text,
  state text NOT NULL DEFAULT 'none' CHECK (state IN ('created', 'deleted', 'none')),
  last_action text CHECK (last_action IN ('create', 'update', 'delete', 'bump')),
  last_action_state text CHECK (last_action_state IN ('processing', 'done', 'error')),
  last_error text,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (car_id)
);

-- Enable RLS på blocket_ad_sync
ALTER TABLE public.blocket_ad_sync ENABLE ROW LEVEL SECURITY;

-- RLS policies för blocket_ad_sync (samma som cars - baserat på company)
CREATE POLICY "Users can view blocket sync for their company's cars"
ON public.blocket_ad_sync
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cars
    WHERE cars.id = blocket_ad_sync.car_id
    AND user_belongs_to_company(cars.company_id)
  )
);

CREATE POLICY "Users can insert blocket sync for their company's cars"
ON public.blocket_ad_sync
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cars
    WHERE cars.id = blocket_ad_sync.car_id
    AND user_belongs_to_company(cars.company_id)
  )
);

CREATE POLICY "Users can update blocket sync for their company's cars"
ON public.blocket_ad_sync
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.cars
    WHERE cars.id = blocket_ad_sync.car_id
    AND user_belongs_to_company(cars.company_id)
  )
);

CREATE POLICY "Users can delete blocket sync for their company's cars"
ON public.blocket_ad_sync
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.cars
    WHERE cars.id = blocket_ad_sync.car_id
    AND user_belongs_to_company(cars.company_id)
  )
);

-- Trigger för att uppdatera updated_at
CREATE TRIGGER update_blocket_ad_sync_updated_at
BEFORE UPDATE ON public.blocket_ad_sync
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index för snabbare lookups
CREATE INDEX IF NOT EXISTS idx_blocket_ad_sync_source_id ON public.blocket_ad_sync(source_id);
CREATE INDEX IF NOT EXISTS idx_blocket_ad_sync_state ON public.blocket_ad_sync(state);
CREATE INDEX IF NOT EXISTS idx_cars_publish_on_blocket ON public.cars(publish_on_blocket) WHERE publish_on_blocket = true;