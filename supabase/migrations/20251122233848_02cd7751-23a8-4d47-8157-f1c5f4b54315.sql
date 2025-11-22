-- Add trial_end_date column to companies table
ALTER TABLE companies 
ADD COLUMN trial_end_date timestamp with time zone;

-- Set trial_end_date for existing companies (21 days from created_at)
UPDATE companies 
SET trial_end_date = created_at + interval '21 days'
WHERE trial_end_date IS NULL;

-- Create function to automatically set trial_end_date for new companies
CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.trial_end_date := NEW.created_at + interval '21 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to set trial_end_date automatically for new companies
DROP TRIGGER IF EXISTS set_trial_end_date_trigger ON companies;
CREATE TRIGGER set_trial_end_date_trigger
  BEFORE INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_end_date();