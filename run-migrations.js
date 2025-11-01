#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "migrations" (
        "id" SERIAL PRIMARY KEY,
        "filename" TEXT NOT NULL UNIQUE,
        "executed_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get list of executed migrations
    const executedResult = await pool.query('SELECT filename FROM "migrations"');
    const executedMigrations = new Set(executedResult.rows.map(row => row.filename));

    // Read migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    let executedCount = 0;

    for (const filename of migrationFiles) {
      if (executedMigrations.has(filename)) {
        console.log(`⏩ Skipping ${filename} (already executed)`);
        continue;
      }

      console.log(`🔄 Executing ${filename}...`);
      
      const filePath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute migration in a transaction
      await pool.query('BEGIN');
      
      try {
        // Split by semicolons but preserve those within strings
        const statements = sql
          .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
          .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'))
          .map(stmt => stmt.trim());

        // Execute each statement
        for (const statement of statements) {
          if (statement.trim()) {
            await pool.query(statement);
          }
        }
        
        await pool.query('INSERT INTO "migrations" (filename) VALUES ($1)', [filename]);
        await pool.query('COMMIT');
        
        console.log(`✅ Successfully executed ${filename}`);
        executedCount++;
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`❌ Failed to execute ${filename}:`, error.message);
        throw error;
      }
    }

    if (executedCount === 0) {
      console.log('✨ No new migrations to execute');
    } else {
      console.log(`✨ Successfully executed ${executedCount} migration(s)`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();