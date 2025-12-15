-- Add columns for scheduled plan changes
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS scheduled_plan text,
ADD COLUMN IF NOT EXISTS scheduled_plan_date timestamp with time zone;