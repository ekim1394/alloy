


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "stripe";


ALTER SCHEMA "stripe" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_trial_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.subscriptions (user_id, plan, status, trial_ends_at, minutes_included)
  values (new.id, 'pro', 'trialing', now() + interval '7 days', 300);
  return new;
end;
$$;


ALTER FUNCTION "public"."create_trial_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_job_usage"("p_user_id" "uuid", "p_job_id" "uuid", "p_minutes" double precision) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_sub_id uuid;
begin
  -- Get user's subscription
  select id into v_sub_id
  from public.subscriptions
  where user_id = p_user_id;
  
  if v_sub_id is null then
    raise exception 'No subscription found for user';
  end if;
  
  -- Record the usage
  insert into public.usage_records (subscription_id, job_id, minutes_used)
  values (v_sub_id, p_job_id, p_minutes);
  
  -- Update total usage
  update public.subscriptions
  set minutes_used = minutes_used + p_minutes,
      updated_at = now()
  where id = v_sub_id;
end;
$$;


ALTER FUNCTION "public"."record_job_usage"("p_user_id" "uuid", "p_job_id" "uuid", "p_minutes" double precision) OWNER TO "postgres";


CREATE FOREIGN DATA WRAPPER "stripe_wrapper" HANDLER "extensions"."stripe_fdw_handler" VALIDATOR "extensions"."stripe_fdw_validator";




CREATE SERVER "stripe_server" FOREIGN DATA WRAPPER "stripe_wrapper" OPTIONS (
    "api_key_name" 'stripe'
);


ALTER SERVER "stripe_server" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "key_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artifacts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "path" "text" NOT NULL,
    "size_bytes" bigint DEFAULT 0 NOT NULL,
    "download_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."artifacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "source_type" "text" DEFAULT 'git'::"text" NOT NULL,
    "source_url" "text",
    "command" "text",
    "script" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "worker_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "exit_code" integer,
    "build_minutes" double precision,
    CONSTRAINT "jobs_source_type_check" CHECK (("source_type" = ANY (ARRAY['git'::"text", 'upload'::"text"]))),
    CONSTRAINT "jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan" "text" DEFAULT 'pro'::"text" NOT NULL,
    "status" "text" DEFAULT 'trialing'::"text" NOT NULL,
    "trial_ends_at" timestamp with time zone,
    "minutes_included" integer DEFAULT 300 NOT NULL,
    "minutes_used" double precision DEFAULT 0 NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscriptions_plan_check" CHECK (("plan" = ANY (ARRAY['pro'::"text", 'team'::"text"]))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'past_due'::"text", 'canceled'::"text", 'trialing'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "job_id" "uuid" NOT NULL,
    "minutes_used" double precision NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."usage_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "hostname" "text" NOT NULL,
    "capacity" integer DEFAULT 2 NOT NULL,
    "current_jobs" integer DEFAULT 0 NOT NULL,
    "last_heartbeat" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'online'::"text" NOT NULL,
    CONSTRAINT "workers_status_check" CHECK (("status" = ANY (ARRAY['online'::"text", 'busy'::"text", 'offline'::"text", 'draining'::"text"])))
);


ALTER TABLE "public"."workers" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."customers" (
    "id" "text",
    "email" "text",
    "name" "text",
    "description" "text",
    "created" timestamp without time zone,
    "attrs" "jsonb"
)
SERVER "stripe_server"
OPTIONS (
    "object" 'customers',
    "rowid_column" 'id'
);


ALTER FOREIGN TABLE "stripe"."customers" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."invoices" (
    "id" "text",
    "customer" "text",
    "subscription" "text",
    "status" "text",
    "total" bigint,
    "currency" "text",
    "created" timestamp without time zone,
    "attrs" "jsonb"
)
SERVER "stripe_server"
OPTIONS (
    "object" 'invoices'
);


ALTER FOREIGN TABLE "stripe"."invoices" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."prices" (
    "id" "text",
    "product" "text",
    "active" boolean,
    "currency" "text",
    "unit_amount" bigint,
    "type" "text",
    "attrs" "jsonb"
)
SERVER "stripe_server"
OPTIONS (
    "object" 'prices',
    "rowid_column" 'id'
);


ALTER FOREIGN TABLE "stripe"."prices" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."products" (
    "id" "text",
    "name" "text",
    "active" boolean,
    "description" "text",
    "attrs" "jsonb"
)
SERVER "stripe_server"
OPTIONS (
    "object" 'products',
    "rowid_column" 'id'
);


ALTER FOREIGN TABLE "stripe"."products" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."subscriptions" (
    "id" "text",
    "customer" "text",
    "status" "text",
    "currency" "text",
    "current_period_start" timestamp without time zone,
    "current_period_end" timestamp without time zone,
    "attrs" "jsonb"
)
SERVER "stripe_server"
OPTIONS (
    "object" 'subscriptions',
    "rowid_column" 'id'
);


ALTER FOREIGN TABLE "stripe"."subscriptions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_key_hash_key" UNIQUE ("key_hash");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."usage_records"
    ADD CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workers"
    ADD CONSTRAINT "workers_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_api_keys_hash" ON "public"."api_keys" USING "btree" ("key_hash");



CREATE INDEX "idx_api_keys_user" ON "public"."api_keys" USING "btree" ("user_id");



CREATE INDEX "idx_artifacts_job_id" ON "public"."artifacts" USING "btree" ("job_id");



CREATE INDEX "idx_jobs_created_at" ON "public"."jobs" USING "btree" ("created_at");



CREATE INDEX "idx_jobs_customer_id" ON "public"."jobs" USING "btree" ("customer_id");



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_stripe_customer" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_usage_records_subscription" ON "public"."usage_records" USING "btree" ("subscription_id");



CREATE INDEX "idx_workers_status" ON "public"."workers" USING "btree" ("status");



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_records"
    ADD CONSTRAINT "usage_records_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_records"
    ADD CONSTRAINT "usage_records_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated access to artifacts" ON "public"."artifacts" USING (true);



CREATE POLICY "Allow authenticated access to jobs" ON "public"."jobs" USING (true);



CREATE POLICY "Allow authenticated access to workers" ON "public"."workers" USING (true);



CREATE POLICY "Service role can manage subscriptions" ON "public"."subscriptions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage usage" ON "public"."usage_records" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can create own API keys" ON "public"."api_keys" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own API keys" ON "public"."api_keys" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own API keys" ON "public"."api_keys" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own subscription" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own usage" ON "public"."usage_records" FOR SELECT USING (("subscription_id" IN ( SELECT "subscriptions"."id"
   FROM "public"."subscriptions"
  WHERE ("subscriptions"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artifacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workers" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
























































































































































































































































































































GRANT ALL ON FUNCTION "public"."create_trial_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_trial_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_trial_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_job_usage"("p_user_id" "uuid", "p_job_id" "uuid", "p_minutes" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."record_job_usage"("p_user_id" "uuid", "p_job_id" "uuid", "p_minutes" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_job_usage"("p_user_id" "uuid", "p_job_id" "uuid", "p_minutes" double precision) TO "service_role";





















GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."artifacts" TO "anon";
GRANT ALL ON TABLE "public"."artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."usage_records" TO "anon";
GRANT ALL ON TABLE "public"."usage_records" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_records" TO "service_role";



GRANT ALL ON TABLE "public"."workers" TO "anon";
GRANT ALL ON TABLE "public"."workers" TO "authenticated";
GRANT ALL ON TABLE "public"."workers" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































