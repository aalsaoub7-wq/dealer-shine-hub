-- Add Stripe customer ID to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

-- Create subscriptions table to track Stripe subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can view subscriptions for their company
CREATE POLICY "Users can view their company subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = auth.uid() AND company_id = subscriptions.company_id
  )
);

-- Add stripe_invoice_id to usage_stats to track which invoices have been sent
ALTER TABLE public.usage_stats
ADD COLUMN IF NOT EXISTS stripe_invoice_id text;

-- Add trigger for updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();