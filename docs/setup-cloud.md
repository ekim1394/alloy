# Cloud Setup (Supabase)

This guide covers setting up Jules Mac Runner with [Supabase](https://supabase.com) for managed database, authentication, and storage.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **Anon/Service Key**.

## 2. GitHub Authentication

To enable GitHub sign-in:

1. Go to **GitHub Developer Settings** -> **OAuth Apps** -> **New OAuth App**.
2. **Homepage URL**: `https://<your-project>.supabase.co` (or your custom domain)
3. **Authorization callback URL**: `https://<your-project>.supabase.co/auth/v1/callback`
4. Register application.
5. Copy **Client ID** and **Client Secret**.

In Supabase Dashboard:
1. Go to **Authentication** -> **Providers**.
2. Enable **GitHub**.
3. Enter your **Client ID** and **Client Secret**.
4. Save.

## 3. Database Schema

In the Supabase SQL Editor, run the schema:

```sql
-- Copy contents from supabase/schema.sql
```

This creates:
- Tables: `jobs`, `artifacts`, `users`, `subscriptions`, `job_logs`
- Buckets: `artifacts`, `sources`
- RLS Policies for security

## 4. Billing Setup (Stripe)

The project uses Supabase Edge Functions and Stripe Wrapper.

1. Create a **Stripe Account**.
2. Create two Products (Pro and Team) in Stripe.
3. Get your **Stripe Secret Key** and **Webhook Switch Secret**.

### Deploy Edge Functions

```bash
# Login to Supabase CLI
supabase login

# Link check
supabase link --project-ref <your-project-ref>

# Deploy functions
supabase functions deploy
```

### Set Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRO_PRICE_ID=price_...
supabase secrets set STRIPE_TEAM_PRICE_ID=price_...
```

## 5. Environment Variables

### Orchestrator (.env)

```bash
# Supabase Connection
DATABASE_MODE=supabase
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<your-service-role-key>

# Server
PORT=3000
BASE_URL=https://api.alloy-ci.dev

# Security
WORKER_SECRET_KEY=<generate-a-random-secret>
CORS_ORIGINS=https://alloy-ci.dev,https://app.alloy-ci.dev
```

### Worker (.env)

```bash
ORCHESTRATOR_URL=https://api.alloy-ci.dev
WORKER_SECRET_KEY=<same-secret-as-orchestrator>
```

### Dashboard (.env)

```bash
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=https://api.alloy-ci.dev
```

## 6. Start the Orchestrator

```bash
./target/release/orchestrator
```

## 7. Verify

```bash
curl https://api.alloy-ci.dev/health
# {"status":"ok"}
```

## Next Steps

- [Worker Setup](./setup-worker.md) - Add Mac Mini workers
- [CLI Usage](./cli-usage.md) - Submit your first job
