-- Create usage stats table for tracking monthly usage and costs
CREATE TABLE IF NOT EXISTS public.usage_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month date NOT NULL, -- First day of the month
  generated_descriptions_count integer NOT NULL DEFAULT 0,
  edited_images_count integer NOT NULL DEFAULT 0,
  added_cars_count integer NOT NULL DEFAULT 0,
  generated_descriptions_cost numeric(10,2) NOT NULL DEFAULT 0,
  edited_images_cost numeric(10,2) NOT NULL DEFAULT 0,
  added_cars_cost numeric(10,2) NOT NULL DEFAULT 0,
  total_cost numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage stats
CREATE POLICY "Users can view their own usage stats"
  ON public.usage_stats
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own usage stats
CREATE POLICY "Users can insert their own usage stats"
  ON public.usage_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage stats
CREATE POLICY "Users can update their own usage stats"
  ON public.usage_stats
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_usage_stats_user_month ON public.usage_stats(user_id, month DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_usage_stats_updated_at
  BEFORE UPDATE ON public.usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();