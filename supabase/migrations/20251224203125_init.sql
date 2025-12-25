
  create table "public"."api_keys" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "name" text not null,
    "key_hash" text not null,
    "created_at" timestamp with time zone not null default now(),
    "last_used_at" timestamp with time zone
      );


alter table "public"."api_keys" enable row level security;


  create table "public"."artifacts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "job_id" uuid not null,
    "name" text not null,
    "path" text not null,
    "size_bytes" bigint not null default 0,
    "download_url" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."artifacts" enable row level security;


  create table "public"."jobs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "customer_id" uuid not null,
    "source_type" text not null default 'git'::text,
    "source_url" text,
    "command" text,
    "script" text,
    "status" text not null default 'pending'::text,
    "worker_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "exit_code" integer,
    "build_minutes" double precision
      );


alter table "public"."jobs" enable row level security;


  create table "public"."workers" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "hostname" text not null,
    "capacity" integer not null default 2,
    "current_jobs" integer not null default 0,
    "last_heartbeat" timestamp with time zone not null default now(),
    "status" text not null default 'online'::text
      );


alter table "public"."workers" enable row level security;

CREATE UNIQUE INDEX api_keys_key_hash_key ON public.api_keys USING btree (key_hash);

CREATE UNIQUE INDEX api_keys_pkey ON public.api_keys USING btree (id);

CREATE UNIQUE INDEX artifacts_pkey ON public.artifacts USING btree (id);

CREATE INDEX idx_api_keys_hash ON public.api_keys USING btree (key_hash);

CREATE INDEX idx_api_keys_user ON public.api_keys USING btree (user_id);

CREATE INDEX idx_artifacts_job_id ON public.artifacts USING btree (job_id);

CREATE INDEX idx_jobs_created_at ON public.jobs USING btree (created_at);

CREATE INDEX idx_jobs_customer_id ON public.jobs USING btree (customer_id);

CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);

CREATE INDEX idx_workers_status ON public.workers USING btree (status);

CREATE UNIQUE INDEX jobs_pkey ON public.jobs USING btree (id);

CREATE UNIQUE INDEX workers_pkey ON public.workers USING btree (id);

alter table "public"."api_keys" add constraint "api_keys_pkey" PRIMARY KEY using index "api_keys_pkey";

alter table "public"."artifacts" add constraint "artifacts_pkey" PRIMARY KEY using index "artifacts_pkey";

alter table "public"."jobs" add constraint "jobs_pkey" PRIMARY KEY using index "jobs_pkey";

alter table "public"."workers" add constraint "workers_pkey" PRIMARY KEY using index "workers_pkey";

alter table "public"."api_keys" add constraint "api_keys_key_hash_key" UNIQUE using index "api_keys_key_hash_key";

alter table "public"."artifacts" add constraint "artifacts_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."artifacts" validate constraint "artifacts_job_id_fkey";

alter table "public"."jobs" add constraint "jobs_source_type_check" CHECK ((source_type = ANY (ARRAY['git'::text, 'upload'::text]))) not valid;

alter table "public"."jobs" validate constraint "jobs_source_type_check";

alter table "public"."jobs" add constraint "jobs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))) not valid;

alter table "public"."jobs" validate constraint "jobs_status_check";

alter table "public"."workers" add constraint "workers_status_check" CHECK ((status = ANY (ARRAY['online'::text, 'busy'::text, 'offline'::text, 'draining'::text]))) not valid;

alter table "public"."workers" validate constraint "workers_status_check";

grant delete on table "public"."api_keys" to "anon";

grant insert on table "public"."api_keys" to "anon";

grant references on table "public"."api_keys" to "anon";

grant select on table "public"."api_keys" to "anon";

grant trigger on table "public"."api_keys" to "anon";

grant truncate on table "public"."api_keys" to "anon";

grant update on table "public"."api_keys" to "anon";

grant delete on table "public"."api_keys" to "authenticated";

grant insert on table "public"."api_keys" to "authenticated";

grant references on table "public"."api_keys" to "authenticated";

grant select on table "public"."api_keys" to "authenticated";

grant trigger on table "public"."api_keys" to "authenticated";

grant truncate on table "public"."api_keys" to "authenticated";

grant update on table "public"."api_keys" to "authenticated";

grant delete on table "public"."api_keys" to "service_role";

grant insert on table "public"."api_keys" to "service_role";

grant references on table "public"."api_keys" to "service_role";

grant select on table "public"."api_keys" to "service_role";

grant trigger on table "public"."api_keys" to "service_role";

grant truncate on table "public"."api_keys" to "service_role";

grant update on table "public"."api_keys" to "service_role";

grant delete on table "public"."artifacts" to "anon";

grant insert on table "public"."artifacts" to "anon";

grant references on table "public"."artifacts" to "anon";

grant select on table "public"."artifacts" to "anon";

grant trigger on table "public"."artifacts" to "anon";

grant truncate on table "public"."artifacts" to "anon";

grant update on table "public"."artifacts" to "anon";

grant delete on table "public"."artifacts" to "authenticated";

grant insert on table "public"."artifacts" to "authenticated";

grant references on table "public"."artifacts" to "authenticated";

grant select on table "public"."artifacts" to "authenticated";

grant trigger on table "public"."artifacts" to "authenticated";

grant truncate on table "public"."artifacts" to "authenticated";

grant update on table "public"."artifacts" to "authenticated";

grant delete on table "public"."artifacts" to "service_role";

grant insert on table "public"."artifacts" to "service_role";

grant references on table "public"."artifacts" to "service_role";

grant select on table "public"."artifacts" to "service_role";

grant trigger on table "public"."artifacts" to "service_role";

grant truncate on table "public"."artifacts" to "service_role";

grant update on table "public"."artifacts" to "service_role";

grant delete on table "public"."jobs" to "anon";

grant insert on table "public"."jobs" to "anon";

grant references on table "public"."jobs" to "anon";

grant select on table "public"."jobs" to "anon";

grant trigger on table "public"."jobs" to "anon";

grant truncate on table "public"."jobs" to "anon";

grant update on table "public"."jobs" to "anon";

grant delete on table "public"."jobs" to "authenticated";

grant insert on table "public"."jobs" to "authenticated";

grant references on table "public"."jobs" to "authenticated";

grant select on table "public"."jobs" to "authenticated";

grant trigger on table "public"."jobs" to "authenticated";

grant truncate on table "public"."jobs" to "authenticated";

grant update on table "public"."jobs" to "authenticated";

grant delete on table "public"."jobs" to "service_role";

grant insert on table "public"."jobs" to "service_role";

grant references on table "public"."jobs" to "service_role";

grant select on table "public"."jobs" to "service_role";

grant trigger on table "public"."jobs" to "service_role";

grant truncate on table "public"."jobs" to "service_role";

grant update on table "public"."jobs" to "service_role";

grant delete on table "public"."workers" to "anon";

grant insert on table "public"."workers" to "anon";

grant references on table "public"."workers" to "anon";

grant select on table "public"."workers" to "anon";

grant trigger on table "public"."workers" to "anon";

grant truncate on table "public"."workers" to "anon";

grant update on table "public"."workers" to "anon";

grant delete on table "public"."workers" to "authenticated";

grant insert on table "public"."workers" to "authenticated";

grant references on table "public"."workers" to "authenticated";

grant select on table "public"."workers" to "authenticated";

grant trigger on table "public"."workers" to "authenticated";

grant truncate on table "public"."workers" to "authenticated";

grant update on table "public"."workers" to "authenticated";

grant delete on table "public"."workers" to "service_role";

grant insert on table "public"."workers" to "service_role";

grant references on table "public"."workers" to "service_role";

grant select on table "public"."workers" to "service_role";

grant trigger on table "public"."workers" to "service_role";

grant truncate on table "public"."workers" to "service_role";

grant update on table "public"."workers" to "service_role";


  create policy "Users can create own API keys"
  on "public"."api_keys"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can delete own API keys"
  on "public"."api_keys"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own API keys"
  on "public"."api_keys"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Allow authenticated access to artifacts"
  on "public"."artifacts"
  as permissive
  for all
  to public
using (true);



  create policy "Allow authenticated access to jobs"
  on "public"."jobs"
  as permissive
  for all
  to public
using (true);



  create policy "Allow authenticated access to workers"
  on "public"."workers"
  as permissive
  for all
  to public
using (true);



  create policy "Allow authenticated upload to artifacts"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'artifacts'::text));



  create policy "Allow public read access to artifacts"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'artifacts'::text));



