# Database Setup and Migrations

## Overview

LLM.txt Mastery supports multiple database configurations:
- **Local PostgreSQL** (via Docker)
- **Supabase** (for authentication and user management)
- **Neon/Railway** (for production hosting)

## Quick Start

### 1. Development Setup
```bash
# Install dependencies and run setup
npm install
npm run setup

# Start local PostgreSQL (recommended)
docker-compose up -d

# Run migrations
npm run migrate
```

### 2. Production Setup
```bash
# Set DATABASE_URL in your .env file
# Run migrations
npm run migrate

# For Supabase auth integration
npm run migrate:supabase
```

## Migration Scripts

### Available Commands

```bash
# PostgreSQL Migrations
npm run migrate              # Run pending migrations
npm run migrate:status       # Check migration status
npm run migrate:reset        # Reset and re-run all migrations

# Supabase Migrations
npm run migrate:supabase     # Run Supabase auth migrations
npm run migrate:status:supabase # Check Supabase migration status
npm run migrate:reset:supabase  # Reset Supabase migrations

# Legacy support
npm run db:migrate           # Alias for npm run migrate
```

### Migration Files Structure

```
migrations/                  # PostgreSQL migrations
├── 000_base_schema.sql     # Base tables (users, analyses, etc.)
├── 001_add_smart_caching.sql # Caching and tier system
└── ...                     # Future migrations

supabase/migrations/         # Supabase-specific migrations
├── 001_create_user_profiles.sql # User profiles with RLS
└── ...                     # Future auth-related migrations
```

## Database Configurations

### Local Development (Docker)

1. **Start PostgreSQL**:
   ```bash
   docker-compose up -d
   ```

2. **Set environment variables**:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/llm_txt_mastery
   ```

3. **Run migrations**:
   ```bash
   npm run migrate
   ```

### Supabase Setup

1. **Create Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and keys

2. **Set environment variables**:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Frontend variables
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run Supabase migrations**:
   ```bash
   npm run migrate:supabase
   ```

### Production (Neon/Railway)

1. **Set production DATABASE_URL**:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

2. **Run migrations**:
   ```bash
   npm run migrate
   ```

## Migration System Features

### 1. Automatic Tracking
- Migrations are tracked in `schema_migrations` table
- Each migration records filename, timestamp, and checksum
- Prevents duplicate execution

### 2. Multi-Database Support
- PostgreSQL (main application database)
- Supabase (authentication and user profiles)
- Different migration directories for each system

### 3. Safety Features
- Checksum validation prevents corruption
- Transaction support for rollback safety
- Clear error reporting and logging

### 4. Development Tools
- Status checking before running migrations
- Reset functionality for development
- Comprehensive logging and error handling

## Database Schema Overview

### Core Tables (PostgreSQL)

```sql
-- User management
users                    # Basic user records
emailCaptures           # Email signup tracking

-- Analysis system
sitemapAnalysis         # Website analysis records
llmTextFiles           # Generated LLM.txt files

-- Caching system
analysis_cache          # Smart caching with change detection
cache_savings          # Cost tracking and savings

-- Usage tracking
usage_limits           # Tier configuration
usage_tracking         # Daily usage monitoring
```

### Authentication Tables (Supabase)

```sql
-- Supabase built-in
auth.users             # Authentication records

-- Custom tables
user_profiles          # Extended user data with tiers
                       # Links to auth.users via foreign key
```

## Migration Best Practices

### 1. Writing Migrations

```sql
-- Good: Use IF NOT EXISTS for safety
CREATE TABLE IF NOT EXISTS new_table (...);

-- Good: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_table_column ON table(column);

-- Good: Use transactions for complex operations
BEGIN;
-- Multiple operations
COMMIT;
```

### 2. Migration Naming

```
000_base_schema.sql         # Initial schema
001_add_caching_system.sql  # Feature additions
002_update_user_tiers.sql   # Schema changes
003_performance_indexes.sql # Performance improvements
```

### 3. Development Workflow

```bash
# 1. Write new migration file
# 2. Test locally
npm run migrate:status
npm run migrate

# 3. Test reset (optional)
npm run migrate:reset

# 4. Commit migration file
git add migrations/002_new_feature.sql
git commit -m "Add new feature migration"
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```
   - Ensure PostgreSQL is running (`docker-compose up -d`)
   - Check DATABASE_URL in .env file

2. **Migration Already Applied**
   ```
   Error: duplicate key value violates unique constraint
   ```
   - Check migration status: `npm run migrate:status`
   - Skip if already applied, or reset for development

3. **Supabase Connection Failed**
   ```
   Error: Invalid API key
   ```
   - Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
   - Check Supabase dashboard for correct credentials

4. **SQL Syntax Errors**
   ```
   Error: syntax error at or near "..."
   ```
   - Validate SQL in migration file
   - Test individual statements manually

### Debug Commands

```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Manual migration check
psql $DATABASE_URL -c "SELECT * FROM schema_migrations"

# Test individual migration
psql $DATABASE_URL -f migrations/001_example.sql
```

### Docker Commands

```bash
# PostgreSQL container management
docker-compose up -d          # Start PostgreSQL
docker-compose down           # Stop PostgreSQL
docker-compose logs postgres  # View logs

# Connect to database
docker exec -it llm-txt-mastery-postgres-1 psql -U postgres -d llm_txt_mastery
```

## Production Deployment

### 1. Environment Setup
```bash
# Set production environment
export NODE_ENV=production
export DATABASE_URL=postgresql://...

# Run migrations
npm run migrate
```

### 2. Automated Deployment
```yaml
# Example GitHub Actions
- name: Run Database Migrations
  run: |
    npm install
    npm run migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 3. Monitoring
- Monitor migration execution in production logs
- Set up alerts for migration failures
- Keep migration logs for debugging

## Future Enhancements

### Planned Features
- **Migration rollback**: Ability to rollback migrations
- **Seed data**: Initial data loading scripts
- **Schema validation**: Automatic schema validation
- **Migration testing**: Automated migration testing

### Integration Ideas
- **CI/CD integration**: Automatic migration on deploy
- **Schema documentation**: Auto-generated schema docs
- **Performance monitoring**: Migration performance tracking
- **Backup integration**: Automatic backups before migrations

This migration system provides a robust foundation for managing database changes across different environments and database systems.