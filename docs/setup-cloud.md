# Cloud Setup (Supabase)

This guide covers setting up Jules Mac Runner with [Supabase](https://supabase.com) for managed database and storage.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon/service key

## 2. Run Database Schema

In the Supabase SQL Editor, run the schema:

```sql
-- Copy contents from supabase/schema.sql
```

Or using the CLI:
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## 3. Configure Environment

```bash
cp env.example .env
```

Edit `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-or-service-key

# Orchestrator settings
PORT=3000
BASE_URL=http://localhost:3000
```

## 4. Start the Orchestrator

```bash
./target/release/orchestrator
```

You should see:
```
INFO orchestrator: Starting Jules Mac Runner on 0.0.0.0:3000
```

## 5. Verify

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

## Storage Buckets

The schema creates two storage buckets:
- `artifacts` - Build artifacts (.ipa, .xcresult)
- `sources` - Uploaded source archives

## Next Steps

- [Worker Setup](./setup-worker.md) - Add Mac Mini workers
- [CLI Usage](./cli-usage.md) - Submit your first job
