# Local Development Setup (VS Code)

This project was originally built for Replit, which automatically provides PostgreSQL. Here's how to run it locally:

## Option 1: Use SQLite for Local Testing (Easiest)

1. Install SQLite adapter for Drizzle:
```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

2. Create a local development configuration that uses SQLite instead of PostgreSQL.

## Option 2: Use Docker for PostgreSQL (Recommended)

1. Create a `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: llm_txt_mastery
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

2. Start PostgreSQL:
```bash
docker-compose up -d
```

3. Update `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/llm_txt_mastery
```

## Option 3: Use Neon (Free Cloud PostgreSQL)

1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string to `.env`:
```
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require
```

## Running the Application

After setting up the database:

1. Run migrations:
```bash
npm run db:migrate
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000

## Differences from Replit

- **Port**: Changed from 5000 to 3000 (macOS uses 5000 for AirPlay)
- **Database**: Need to manually provision PostgreSQL
- **Environment**: Need to create `.env` file manually
- **Storage**: Using in-memory storage fallback when DB not configured