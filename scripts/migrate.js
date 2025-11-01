#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * Supports multiple database systems:
 * - PostgreSQL (via DATABASE_URL)
 * - Supabase (via SUPABASE_URL + service role key)
 * 
 * Usage:
 *   npm run migrate              # Run all pending PostgreSQL migrations
 *   npm run migrate:supabase     # Run Supabase migrations
 *   npm run migrate:reset        # Reset and re-run all migrations
 *   npm run migrate:status       # Check migration status
 */

import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

// Configuration
const MIGRATIONS_TABLE = 'schema_migrations';
const POSTGRES_MIGRATIONS_DIR = path.join(projectRoot, 'migrations');
const SUPABASE_MIGRATIONS_DIR = path.join(projectRoot, 'supabase', 'migrations');

// Command line arguments
const command = process.argv[2] || 'run';
const target = process.argv[3] || 'postgres';

class MigrationRunner {
  constructor(connectionString, migrationsDir) {
    this.pool = new Pool({ connectionString });
    this.migrationsDir = migrationsDir;
  }

  async connect() {
    // Test connection
    await this.pool.query('SELECT 1');
    console.log('✅ Database connection established');
  }

  async disconnect() {
    await this.pool.end();
  }

  async ensureMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW(),
        checksum VARCHAR(64)
      );
    `;
    
    await this.pool.query(createTableSQL);
    console.log('✅ Migrations table ready');
  }

  async getAppliedMigrations() {
    try {
      const result = await this.pool.query(
        `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY filename`
      );
      return result.rows.map(row => row.filename);
    } catch (error) {
      // Table might not exist yet
      return [];
    }
  }

  async getPendingMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      console.log(`⚠️  Migrations directory not found: ${this.migrationsDir}`);
      return [];
    }

    const allMigrations = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = allMigrations.filter(
      migration => !appliedMigrations.includes(migration)
    );

    return pendingMigrations;
  }

  async calculateChecksum(content) {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async runMigration(filename) {
    const filePath = path.join(this.migrationsDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const checksum = await this.calculateChecksum(content);

    console.log(`🔄 Running migration: ${filename}`);

    try {
      // Split SQL into statements
      const statements = content
        .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim());

      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          await this.pool.query(statement);
        }
      }

      // Record migration as applied
      await this.pool.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (filename, checksum) VALUES ($1, $2)`,
        [filename, checksum]
      );

      console.log(`✅ Migration completed: ${filename}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${filename}`);
      throw error;
    }
  }

  async runPendingMigrations() {
    await this.ensureMigrationsTable();
    const pendingMigrations = await this.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`📦 Found ${pendingMigrations.length} pending migration(s):`);
    pendingMigrations.forEach(migration => {
      console.log(`   - ${migration}`);
    });

    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }

    console.log('🎉 All migrations completed successfully!');
  }

  async getMigrationStatus() {
    await this.ensureMigrationsTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = await this.getPendingMigrations();

    console.log('\n📊 Migration Status:');
    console.log(`   Applied: ${appliedMigrations.length}`);
    console.log(`   Pending: ${pendingMigrations.length}`);

    if (appliedMigrations.length > 0) {
      console.log('\n✅ Applied Migrations:');
      appliedMigrations.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    }

    if (pendingMigrations.length > 0) {
      console.log('\n⏳ Pending Migrations:');
      pendingMigrations.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    }
  }

  async resetMigrations() {
    console.log('⚠️  Resetting all migrations...');
    
    // Drop migrations table
    await this.pool.query(`DROP TABLE IF EXISTS ${MIGRATIONS_TABLE}`);
    console.log('🗑️  Dropped migrations table');

    // Re-run all migrations
    await this.runPendingMigrations();
  }
}

async function getConnectionString(target) {
  if (target === 'supabase') {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase migrations');
    }
    
    // Convert Supabase URL to PostgreSQL connection string
    const url = new URL(supabaseUrl);
    return `postgresql://postgres:${serviceRoleKey}@${url.hostname}:5432/postgres`;
  }
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for PostgreSQL migrations');
  }
  
  return connectionString;
}

function getMigrationsDir(target) {
  return target === 'supabase' ? SUPABASE_MIGRATIONS_DIR : POSTGRES_MIGRATIONS_DIR;
}

async function main() {
  console.log('🚀 LLM.txt Mastery Migration Runner\n');

  try {
    const connectionString = await getConnectionString(target);
    const migrationsDir = getMigrationsDir(target);
    
    console.log(`Target: ${target}`);
    console.log(`Migrations: ${path.relative(projectRoot, migrationsDir)}`);
    
    const runner = new MigrationRunner(connectionString, migrationsDir);
    
    await runner.connect();

    switch (command) {
      case 'run':
        await runner.runPendingMigrations();
        break;
      
      case 'status':
        await runner.getMigrationStatus();
        break;
      
      case 'reset':
        await runner.resetMigrations();
        break;
      
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Available commands: run, status, reset');
        process.exit(1);
    }

    await runner.disconnect();
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}