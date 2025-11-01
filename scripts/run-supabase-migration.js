#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load production environment variables
dotenv.config({ path: '.env.production' });

async function runSupabaseMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🚀 Running Supabase Migration...');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Read and execute the migration SQL
    const migrationSQL = readFileSync('supabase/migrations/001_create_user_profiles.sql', 'utf8');
    
    console.log('📄 Executing migration SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      // Try alternative approach - split into individual statements
      console.log('🔄 Trying alternative approach...');
      
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('📝 Executing:', statement.substring(0, 50) + '...');
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (stmtError) {
            console.log('⚠️  Statement error (may be expected):', stmtError.message);
          }
        }
      }
      
    } else {
      console.log('✅ Migration completed successfully!');
    }
    
    // Test the created table
    console.log('🧪 Testing user_profiles table...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Table test failed:', testError.message);
    } else {
      console.log('✅ user_profiles table is working!');
      console.log('📊 Current rows:', testData?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Migration runner failed:');
    console.error(error.message);
    process.exit(1);
  }
}

runSupabaseMigration();