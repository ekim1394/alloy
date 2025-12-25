# Self-Hosted Setup

This guide covers running Jules Mac Runner entirely self-hosted using SQLite or PostgreSQL.

## SQLite (Simplest)

Zero configuration required! The database is created automatically.

```bash
# Just run it
./target/release/orchestrator

# Database created at: data/jules-mac-runner.db
```

### Custom Path

```bash
export SQLITE_PATH=/var/lib/jules/database.db
./target/release/orchestrator
```

## PostgreSQL (Production)

For production deployments with multiple orchestrator instances.

### 1. Create Database

```bash
createdb jules_mac_runner
```

### 2. Run Migrations

```bash
psql jules_mac_runner < supabase/schema.sql
```

### 3. Configure

```bash
export DATABASE_URL=postgres://user:pass@localhost:5432/jules_mac_runner
./target/release/orchestrator
```

## Docker Compose (Recommended)

```yaml
version: '3.8'
services:
  orchestrator:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://jules:secret@db:5432/jules
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: jules
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: jules
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./supabase/schema.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

## File Storage

For self-hosted, artifacts are stored locally:

```bash
export STORAGE_PATH=/var/lib/jules/storage
```

Or use S3-compatible storage:
```bash
export S3_ENDPOINT=http://minio:9000
export S3_BUCKET=jules-artifacts
export S3_ACCESS_KEY=minioadmin
export S3_SECRET_KEY=minioadmin
```

## Authentication

Self-hosted mode uses local authentication:

```bash
# Create admin user
./target/release/orchestrator user create --email admin@example.com

# Generate API key
./target/release/orchestrator apikey create --name "CI Server"
```

## Next Steps

- [Worker Setup](./setup-worker.md) - Add Mac Mini workers
- [CLI Usage](./cli-usage.md) - Submit your first job
