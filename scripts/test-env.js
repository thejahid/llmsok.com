#!/usr/bin/env node
import dotenv from 'dotenv';

console.log('🔍 Environment Diagnostic...');

// Test .env loading
dotenv.config();

console.log('📄 .env file loading result');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL loaded successfully');
  console.log('🔗 URL format:', process.env.DATABASE_URL.substring(0, 30) + '...');
} else {
  console.log('❌ DATABASE_URL not loaded');
}

// Test production .env specifically
console.log('\n📄 Testing .env.production specifically...');
dotenv.config({ path: '.env.production' });

console.log('DATABASE_URL from production:', !!process.env.DATABASE_URL);

process.exit(0);