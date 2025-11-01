#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load production environment variables
dotenv.config({ path: '.env.production' });

async function testSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔍 Testing Supabase connection...');
  console.log('📡 URL:', supabaseUrl);
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test connection with a simple query
    console.log('📡 Testing connection...');
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.log('⚠️  Query error (expected if table doesn\'t exist):', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('📊 Response:', data);
    }
    
    // Test auth functionality
    console.log('🔐 Testing auth functionality...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth test failed:', authError.message);
    } else {
      console.log('✅ Auth connection successful!');
      console.log('👥 Users count:', authData?.users?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Supabase connection failed:');
    console.error(error.message);
    process.exit(1);
  }
}

testSupabase();