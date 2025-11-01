#!/usr/bin/env node

/**
 * Health Check Script
 * 
 * Validates that all systems are working correctly:
 * - Database connectivity
 * - API endpoints
 * - External integrations
 * 
 * Usage:
 *   npm run health-check
 */

import { config } from 'dotenv';
import { Pool } from '@neondatabase/serverless';

// Load environment variables
config();

console.log('🏥 LLM.txt Mastery Health Check\n');

let hasErrors = false;

// Helper function to test HTTP endpoints
async function testEndpoint(url, description) {
  try {
    console.log(`🔍 Testing ${description}...`);
    const response = await fetch(url);
    
    if (response.ok) {
      console.log(`✅ ${description}: OK (${response.status})`);
      return true;
    } else {
      console.log(`❌ ${description}: Failed (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: Error - ${error.message}`);
    return false;
  }
}

// Test database connectivity
async function testDatabase() {
  console.log('🔍 Testing database connectivity...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('⚠️  DATABASE_URL not set - skipping database test');
    return true; // Not an error if not configured
  }

  try {
    const pool = new Pool({ connectionString });
    await pool.query('SELECT 1');
    await pool.end();
    
    console.log('✅ Database: Connected successfully');
    return true;
  } catch (error) {
    console.log(`❌ Database: Connection failed - ${error.message}`);
    return false;
  }
}

// Test API server
async function testAPI() {
  const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
  
  console.log('\n🌐 Testing API endpoints...');
  
  let apiWorking = true;
  
  // Test basic health
  apiWorking &= await testEndpoint(`${baseUrl}/api/usage/test@example.com`, 'Usage endpoint');
  
  // Test ConvertKit integration
  apiWorking &= await testEndpoint(`${baseUrl}/api/convertkit/status`, 'ConvertKit status');
  
  return apiWorking;
}

// Test external integrations
async function testIntegrations() {
  console.log('\n🔌 Testing external integrations...');
  
  let integrationsWorking = true;
  
  // Test OpenAI (if configured)
  if (process.env.OPENAI_API_KEY) {
    console.log('🔍 Testing OpenAI integration...');
    try {
      // Simple test - check if key format is valid
      const key = process.env.OPENAI_API_KEY;
      if (key.startsWith('sk-') && key.length > 40) {
        console.log('✅ OpenAI: API key format valid');
      } else {
        console.log('❌ OpenAI: Invalid API key format');
        integrationsWorking = false;
      }
    } catch (error) {
      console.log(`❌ OpenAI: Configuration error - ${error.message}`);
      integrationsWorking = false;
    }
  } else {
    console.log('⚠️  OpenAI: API key not configured (optional)');
  }
  
  // Test Supabase (if configured)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    console.log('🔍 Testing Supabase integration...');
    try {
      const url = process.env.SUPABASE_URL;
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.status === 200 || response.status === 404) {
        console.log('✅ Supabase: Connection successful');
      } else {
        console.log(`❌ Supabase: Connection failed (${response.status})`);
        integrationsWorking = false;
      }
    } catch (error) {
      console.log(`❌ Supabase: Connection error - ${error.message}`);
      integrationsWorking = false;
    }
  } else {
    console.log('⚠️  Supabase: Not configured (optional)');
  }
  
  // Test ConvertKit (if configured)
  if (process.env.CONVERTKIT_API_KEY && process.env.CONVERTKIT_API_SECRET) {
    console.log('🔍 Testing ConvertKit integration...');
    try {
      // Test API key format
      const key = process.env.CONVERTKIT_API_KEY;
      if (key.length > 10) {
        console.log('✅ ConvertKit: API credentials configured');
      } else {
        console.log('❌ ConvertKit: Invalid API key format');
        integrationsWorking = false;
      }
    } catch (error) {
      console.log(`❌ ConvertKit: Configuration error - ${error.message}`);
      integrationsWorking = false;
    }
  } else {
    console.log('⚠️  ConvertKit: Not configured (optional)');
  }
  
  return integrationsWorking;
}

// Main health check
async function main() {
  try {
    // Test database
    const dbHealthy = await testDatabase();
    hasErrors = hasErrors || !dbHealthy;
    
    // Test API (only if server is likely running)
    try {
      const apiHealthy = await testAPI();
      hasErrors = hasErrors || !apiHealthy;
    } catch (error) {
      console.log('\n⚠️  API server not running - start with: npm run dev');
    }
    
    // Test integrations
    const integrationsHealthy = await testIntegrations();
    hasErrors = hasErrors || !integrationsHealthy;
    
    // Summary
    console.log('\n📊 Health Check Summary:');
    
    if (hasErrors) {
      console.log('❌ Some systems have issues');
      console.log('\n🔧 Recommended actions:');
      console.log('   - Check environment variables in .env');
      console.log('   - Ensure database is running (docker-compose up -d)');
      console.log('   - Start the API server (npm run dev)');
      console.log('   - Review configuration in docs/');
    } else {
      console.log('✅ All systems healthy!');
      console.log('\n🎉 LLM.txt Mastery is ready to use');
    }
    
    console.log('\n📚 Documentation:');
    console.log('   - docs/database-setup.md - Database configuration');
    console.log('   - docs/supabase-setup.md - Authentication setup');
    console.log('   - docs/convertkit-integration.md - Email automation');
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    hasErrors = true;
  }
  
  if (hasErrors) {
    process.exit(1);
  }
}

// Run health check
main().catch(error => {
  console.error('❌ Health check error:', error.message);
  process.exit(1);
});