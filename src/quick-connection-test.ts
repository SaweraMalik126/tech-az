// Quick Database Connection Test
// This script tests basic connection to your Supabase database

import { supabase } from './integrations/supabase/client';

console.log('🔍 Quick Database Connection Test Starting...\n');

// Test 1: Check Environment Variables
console.log('📋 Test 1: Environment Variables Check');
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔗 Supabase URL:', url ? '✅ Set' : '❌ Not set');
console.log('🔑 Supabase Key:', key ? '✅ Set' : '❌ Not set');

if (!url || !key) {
  console.error('❌ Environment variables are missing! Check your .env file.');
  console.log('💡 Make sure you have:');
  console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  process.exit(1);
}

// Test 2: Basic Connection Test
console.log('\n📡 Test 2: Basic Connection Test');
async function testConnection() {
  try {
    console.log('🔄 Attempting to connect to Supabase...');
    
    // Simple query to test connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection failed with error:');
      console.log('   Error Code:', error.code);
      console.log('   Error Message:', error.message);
      console.log('   Error Details:', error.details);
      
      // Common error codes and solutions
      if (error.code === 'PGRST116') {
        console.log('\n💡 This is an RLS (Row Level Security) error.');
        console.log('   Solution: Either authenticate the user or temporarily disable RLS for testing.');
      } else if (error.code === '42P01') {
        console.log('\n💡 Table "users" does not exist.');
        console.log('   Solution: Check if you have run the schema.sql file in your Supabase database.');
      } else if (error.code === '42501') {
        console.log('\n💡 Permission denied.');
        console.log('   Solution: Check your RLS policies and user permissions.');
      }
      
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Response data:', data);
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error during connection:', err);
    return false;
  }
}

// Test 3: Check if tables exist
console.log('\n📋 Test 3: Table Existence Check');
async function checkTables() {
  const tables = ['users', 'courses', 'institutions', 'enrollments'];
  
  for (const table of tables) {
    try {
      console.log(`🔍 Checking table: ${table}`);
      
      // Try to get table info (this should work even with RLS)
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0); // Just get structure, no data
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`   ❌ Table "${table}" does not exist`);
        } else if (error.code === 'PGRST116') {
          console.log(`   ⚠️ Table "${table}" exists but RLS is blocking access`);
        } else {
          console.log(`   ❌ Error accessing "${table}":`, error.message);
        }
      } else {
        console.log(`   ✅ Table "${table}" exists and is accessible`);
      }
      
    } catch (err) {
      console.log(`   ❌ Unexpected error with "${table}":`, err);
    }
  }
}

// Test 4: Network connectivity test
console.log('\n🌐 Test 4: Network Connectivity Test');
async function testNetwork() {
  try {
    const startTime = Date.now();
    
    // Test direct HTTP request to Supabase
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      console.log(`✅ Network connectivity successful (${responseTime}ms)`);
      return true;
    } else {
      console.log(`❌ Network error: ${response.status} ${response.statusText}`);
      return false;
    }
    
  } catch (err) {
    console.error('❌ Network connectivity failed:', err);
    return false;
  }
}

// Main test runner
async function runQuickTest() {
  console.log('🚀 Running Quick Connection Test...\n');
  
  const results = {
    envVars: !!url && !!key,
    network: false,
    connection: false,
    tables: false
  };
  
  // Run tests
  results.network = await testNetwork();
  results.connection = await testConnection();
  await checkTables();
  
  // Summary
  console.log('\n📊 QUICK TEST SUMMARY');
  console.log('=====================');
  console.log(`Environment Variables: ${results.envVars ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Network Connectivity: ${results.network ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Connection: ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
  
  if (results.connection) {
    console.log('\n🎉 SUCCESS! Your database connection is working!');
    console.log('💡 You can now use the full Database Test page for detailed testing.');
  } else {
    console.log('\n⚠️ Connection failed. Check the error messages above.');
    console.log('💡 Common solutions:');
    console.log('   1. Verify your .env file has correct values');
    console.log('   2. Check if your Supabase project is active');
    console.log('   3. Ensure you have run the schema.sql file');
    console.log('   4. Check RLS policies if tables exist but are inaccessible');
  }
  
  return results;
}

// Export for use in other files
export { runQuickTest, testConnection, checkTables };

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).quickConnectionTest = runQuickTest;
  console.log('💡 Run quickConnectionTest() in the console for a quick connection test');
}
