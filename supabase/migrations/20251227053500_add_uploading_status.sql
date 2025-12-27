ALTER TABLE "public"."jobs" DROP CONSTRAINT "jobs_status_check";

ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_status_check" 
CHECK (status = ANY (ARRAY['pending'::text, 'uploading'::text, 'running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]));
