CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('process-pending-photo-edits');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

TRUNCATE TABLE cron.job_run_details;
TRUNCATE TABLE net._http_response;
