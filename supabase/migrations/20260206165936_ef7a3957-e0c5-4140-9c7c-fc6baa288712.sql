-- 1. Drop the trigger that forces 21-day trial on every new company
DROP TRIGGER IF EXISTS set_trial_end_date_trigger ON companies;

-- 2. Drop the function behind it
DROP FUNCTION IF EXISTS set_trial_end_date();

-- 3. Fix Aram Carcenter's data — remove the wrongly assigned trial
UPDATE companies SET trial_end_date = NULL WHERE name = 'Aram Carcenter';