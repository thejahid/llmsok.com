#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * 
 * This script helps set up the LLM.txt Mastery development environment
 * by checking dependencies, running migrations, and validating configuration.
 * 
 * Usage:
 *   npm run setup
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

// Load environment variables
dotenv.config();

console.log('🚀 LLM.txt Mastery Development Setup\n');

// Helper functions
function checkCommand(command, name) {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' });
    console.log(`✅ ${name} is installed`);
    return true;
  } catch {
    console.log(`❌ ${name} is not installed`);
    return false;
  }
}

function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${name} exists`);
    return true;
  } else {
    console.log(`❌ ${name} not found`);
    return false;
  }
}

function checkEnvVar(varName, required = true) {
  const value = process.env[varName];
  if (value) {
    const displayValue = value.length > 20 ? `${value.substring(0, 20)}...` : value;
    console.log(`✅ ${varName}: ${displayValue}`);
    return true;
  } else {
    const status = required ? '❌' : '⚠️ ';
    console.log(`${status} ${varName}: Not set`);
    return !required;
  }
}

async function runCommand(command, description, optional = false) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit', cwd: projectRoot });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    if (optional) {
      console.log(`⚠️  ${description} failed (optional)`);
      return false;
    } else {
      console.error(`❌ ${description} failed`);
      throw error;
    }
  }
}

async function main() {
  let hasErrors = false;

  // 1. Check system dependencies
  console.log('1. System Dependencies:');
  checkCommand('node', 'Node.js') || (hasErrors = true);
  checkCommand('npm', 'npm') || (hasErrors = true);
  checkCommand('docker', 'Docker') || console.log('   ⚠️  Docker recommended for local PostgreSQL');

  // 2. Check project files
  console.log('\n2. Project Files:');
  checkFile(path.join(projectRoot, 'package.json'), 'package.json') || (hasErrors = true);
  checkFile(path.join(projectRoot, '.env'), '.env file') || (hasErrors = true);
  checkFile(path.join(projectRoot, 'migrations'), 'Migrations directory') || (hasErrors = true);

  // 3. Check environment variables
  console.log('\n3. Environment Variables:');
  console.log('   Core Configuration:');
  checkEnvVar('NODE_ENV', false);
  checkEnvVar('PORT', false);
  
  console.log('   Database:');
  const hasDatabase = checkEnvVar('DATABASE_URL', false);
  
  console.log('   OpenAI (optional):');
  checkEnvVar('OPENAI_API_KEY', false);
  
  console.log('   Supabase (optional):');
  checkEnvVar('SUPABASE_URL', false);
  checkEnvVar('SUPABASE_ANON_KEY', false);
  checkEnvVar('SUPABASE_SERVICE_ROLE_KEY', false);
  
  console.log('   ConvertKit (optional):');
  checkEnvVar('CONVERTKIT_API_KEY', false);
  checkEnvVar('CONVERTKIT_API_SECRET', false);

  // 4. Install dependencies
  console.log('\n4. Installing Dependencies:');
  await runCommand('npm install', 'Install npm packages');

  // 5. Database setup
  console.log('\n5. Database Setup:');
  if (hasDatabase) {
    try {
      await runCommand('npm run migrate:status', 'Check migration status', true);
      await runCommand('npm run migrate', 'Run database migrations', true);
    } catch (error) {
      console.log('⚠️  Database migrations failed - you may need to set up your database first');
    }
  } else {
    console.log('⚠️  DATABASE_URL not set - skipping database setup');
    console.log('   To set up local PostgreSQL:');
    console.log('   1. docker-compose up -d');
    console.log('   2. Add DATABASE_URL to .env');
    console.log('   3. npm run migrate');
  }

  // 6. Validate configuration
  console.log('\n6. Configuration Validation:');
  try {
    await runCommand('npm run test:convertkit', 'Test ConvertKit configuration', true);
  } catch (error) {
    console.log('⚠️  ConvertKit validation failed (optional)');
  }

  // 7. Summary and next steps
  console.log('\n🎉 Setup Summary:');
  
  if (hasErrors) {
    console.log('❌ Setup completed with errors');
    console.log('\n📋 Action Required:');
    console.log('   - Fix missing dependencies and configuration');
    console.log('   - Refer to docs/ for detailed setup instructions');
  } else {
    console.log('✅ Setup completed successfully!');
    console.log('\n🚀 Ready to start development:');
    console.log('   npm run dev     # Start development server');
    console.log('   npm run migrate # Run database migrations');
    console.log('   npm run build   # Build for production');
  }

  console.log('\n📚 Documentation:');
  console.log('   - docs/CLAUDE.md - Development guide');
  console.log('   - docs/supabase-setup.md - Authentication setup');
  console.log('   - docs/convertkit-integration.md - Email automation');

  console.log('\n🔧 Available Commands:');
  console.log('   npm run dev               # Start development server');
  console.log('   npm run migrate           # Run PostgreSQL migrations');
  console.log('   npm run migrate:supabase  # Run Supabase migrations');
  console.log('   npm run migrate:status    # Check migration status');
  console.log('   npm run test:convertkit   # Test ConvertKit setup');
  console.log('   npm run build             # Build for production');
  console.log('   npm run start             # Start production server');

  if (hasErrors) {
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Setup error:', error.message);
  process.exit(1);
});

// Run setup
main().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});