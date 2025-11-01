#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load production environment variables
dotenv.config({ path: '.env.production' });

async function createUserProfilesTable() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🚀 Creating user_profiles table via Supabase API...');
  console.log('📡 URL:', supabaseUrl);
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create the table using raw SQL query
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'coffee', 'growth', 'scale')),
        credits_remaining INTEGER NOT NULL DEFAULT 0,
        stripe_customer_id TEXT UNIQUE,
        subscription_id TEXT,
        subscription_status TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('📄 Creating user_profiles table...');
    
    // Use the SQL query method
    const { data, error } = await supabase
      .from('_postgrest')
      .select()
      .limit(0); // This is just to test connection
    
    if (error) {
      console.log('🔄 Direct SQL approach...');
      
      // Try making a direct HTTP request to the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: createTableSQL
        })
      });
      
      if (response.ok) {
        console.log('✅ Table created successfully!');
      } else {
        const errorText = await response.text();
        console.log('⚠️  Response:', response.status, errorText);
      }
    }
    
    // Test if table exists
    console.log('🧪 Testing if user_profiles table exists...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Table test failed:', testError.message);
      console.log('\n📋 Manual Setup Required:');
      console.log('1. Go to https://supabase.com/dashboard/project/xghwqtmveoiownqxgsii');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of: supabase-manual-setup.sql');
      console.log('4. Click "Run" to execute the SQL');
    } else {
      console.log('✅ user_profiles table exists and is accessible!');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:');
    console.error(error.message);
    
    console.log('\n📋 Manual Setup Required:');
    console.log('1. Go to https://supabase.com/dashboard/project/xghwqtmveoiownqxgsii');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of: supabase-manual-setup.sql');
    console.log('4. Click "Run" to execute the SQL');
  }
}

createUserProfilesTable();