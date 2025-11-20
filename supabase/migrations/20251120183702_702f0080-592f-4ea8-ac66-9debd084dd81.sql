-- Fix existing usage_stats entries with incorrect month dates (timezone issue)
-- Update November 2025 entries that were incorrectly saved as 2025-10-31 instead of 2025-11-01
UPDATE usage_stats
SET month = '2025-11-01'
WHERE month = '2025-10-31' 
  AND created_at >= '2025-11-01'::date;