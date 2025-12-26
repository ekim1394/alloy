create schema if not exists stripe;

-- Customers table
create foreign table stripe.customers (
  id text,
  email text,
  name text,
  description text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'customers',
    rowid_column 'id'
  );

-- Subscriptions table (read-only view)
create foreign table stripe.subscriptions (
  id text,
  customer text,
  status text,
  currency text,
  current_period_start timestamp,
  current_period_end timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'subscriptions',
    rowid_column 'id'
  );

-- Products table
create foreign table stripe.products (
  id text,
  name text,
  active boolean,
  description text,
  attrs jsonb
)
  server stripe_server
  options (
    object 'products',
    rowid_column 'id'
  );

-- Prices table
create foreign table stripe.prices (
  id text,
  product text,
  active boolean,
  currency text,
  unit_amount bigint,
  type text,
  attrs jsonb
)
  server stripe_server
  options (
    object 'prices',
    rowid_column 'id'
  );

-- Invoices table
create foreign table stripe.invoices (
  id text,
  customer text,
  subscription text,
  status text,
  total bigint,
  currency text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'invoices'
  );

-- ============================================
-- 7. Local Tables for Usage Tracking
-- ============================================
-- We still need local tables to track usage since 
-- Stripe wrapper doesn't handle metered billing records

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'pro' check (plan in ('pro', 'team')),
  status text not null default 'trialing' check (status in ('active', 'past_due', 'canceled', 'trialing')),
  trial_ends_at timestamp with time zone,
  minutes_included integer not null default 300,
  minutes_used double precision not null default 0,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  minutes_used double precision not null,
  recorded_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);
create index if not exists idx_usage_records_subscription on public.usage_records(subscription_id);

-- ============================================
-- 8. Row Level Security
-- ============================================
alter table public.subscriptions enable row level security;
alter table public.usage_records enable row level security;

-- Users can view their own subscription
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Users can view their own usage records
create policy "Users can view own usage"
  on public.usage_records for select
  using (
    subscription_id in (
      select id from public.subscriptions where user_id = auth.uid()
    )
  );

-- Service role can manage all subscriptions
create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

create policy "Service role can manage usage"
  on public.usage_records for all
  using (auth.role() = 'service_role');

-- ============================================
-- 9. Helper Functions
-- ============================================

-- Function to create a trial subscription for a new user
create or replace function public.create_trial_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status, trial_ends_at, minutes_included)
  values (new.id, 'pro', 'trialing', now() + interval '7 days', 300);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create trial on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_trial_subscription();

-- Function to record job usage
create or replace function public.record_job_usage(
  p_user_id uuid,
  p_job_id uuid,
  p_minutes double precision
)
returns void as $$
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
$$ language plpgsql security definer;
