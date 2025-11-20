-- Add performance indexes for optimized queries

-- Index for usage_stats queries by user and month
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id_month ON public.usage_stats(user_id, month DESC);

-- Index for photos ordered display
CREATE INDEX IF NOT EXISTS idx_photos_display_order ON public.photos(car_id, display_order);

-- Index for cars soft delete queries
CREATE INDEX IF NOT EXISTS idx_cars_deleted_at ON public.cars(deleted_at) WHERE deleted_at IS NULL;

-- Index for shared_collections expiration checks
CREATE INDEX IF NOT EXISTS idx_shared_collections_expires_at ON public.shared_collections(expires_at) WHERE expires_at IS NOT NULL;

-- Index for blocket sync state queries
CREATE INDEX IF NOT EXISTS idx_blocket_ad_sync_state ON public.blocket_ad_sync(state, last_synced_at);

-- Composite index for common car queries
CREATE INDEX IF NOT EXISTS idx_cars_company_created ON public.cars(company_id, created_at DESC) WHERE deleted_at IS NULL;