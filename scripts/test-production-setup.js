#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Pool } from '@neondatabase/serverless';

// Load production environment variables
dotenv.config({ path: '.env.production' });

async function testProductionSetup() {
  console.log('🚀 Testing Complete Production Setup...\n');
  
  let allPassed = true;
  
  // Test 1: Environment Variables
  console.log('1️⃣ Testing Environment Variables...');
  const requiredEnvs = [
    'DATABASE_URL',
    'SUPABASE_URL', 
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY'
  ];
  
  for (const env of requiredEnvs) {
    if (process.env[env]) {
      console.log(`   ✅ ${env}: Set`);
    } else {
      console.log(`   ❌ ${env}: Missing`);
      allPassed = false;
    }
  }
  
  // Test 2: Neon Database Connection
  console.log('\n2️⃣ Testing Neon Database...');
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT NOW() as timestamp, version()');
    console.log('   ✅ Database connected successfully');
    console.log('   📊 Server time:', result.rows[0].timestamp);
    console.log('   🗃️ PostgreSQL version:', result.rows[0].version.split(' ')[1]);
    await pool.end();
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
    allPassed = false;
  }
  
  // Test 3: Supabase Authentication
  console.log('\n3️⃣ Testing Supabase Authentication...');
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    if (profileError) throw profileError;
    
    console.log('   ✅ Supabase auth connected');
    console.log('   👥 Total users:', authData.users.length);
    console.log('   📋 user_profiles table: Working');
  } catch (error) {
    console.log('   ❌ Supabase test failed:', error.message);
    allPassed = false;
  }
  
  // Test 4: OpenAI API
  console.log('\n4️⃣ Testing OpenAI API...');
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });
    console.log('   ✅ OpenAI API working');
    console.log('   💰 Cost per request: ~$0.001');
  } catch (error) {
    console.log('   ❌ OpenAI test failed:', error.message);
    allPassed = false;
  }
  
  // Test 5: Stripe Configuration
  console.log('\n5️⃣ Testing Stripe Configuration...');
  try {
    const stripeTest = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount: '100',
        currency: 'usd',
        confirm: 'false'
      })
    });
    
    if (stripeTest.ok) {
      console.log('   ✅ Stripe API connected');
      console.log('   💳 Payment processing: Ready');
    } else {
      throw new Error(`Stripe API returned ${stripeTest.status}`);
    }
  } catch (error) {
    console.log('   ❌ Stripe test failed:', error.message);
    allPassed = false;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED - PRODUCTION READY!');
    console.log('✅ Database: Connected');
    console.log('✅ Authentication: Working'); 
    console.log('✅ AI Analysis: Ready');
    console.log('✅ Payments: Configured');
    console.log('\n🚀 Ready to deploy to production!');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('⚠️  Fix the issues above before deploying');
  }
  console.log('='.repeat(50));
  
  return allPassed;
}

testProductionSetup().catch(console.error);