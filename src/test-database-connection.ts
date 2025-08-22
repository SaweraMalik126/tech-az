// Database Connection Test Script
// Run this in your browser console or create a test page to execute it

import { supabase } from './integrations/supabase/client';

console.log('🔍 Starting Database Connection Test...');

// Test 1: Basic Connection Test
async function testBasicConnection() {
  console.log('\n📡 Test 1: Basic Connection Test');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection Error:', error);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    console.log('📊 Response data:', data);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

// Test 2: Authentication Test
async function testAuthentication() {
  console.log('\n🔐 Test 2: Authentication Test');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Authentication Error:', error);
      return false;
    }
    
    console.log('✅ Authentication check successful');
    console.log('👤 Current user:', user);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

// Test 3: Table Access Test
async function testTableAccess() {
  console.log('\n📋 Test 3: Table Access Test');
  
  const tables = ['users', 'courses', 'institutions', 'enrollments'];
  
  for (const table of tables) {
    try {
      console.log(`\n🔍 Testing table: ${table}`);
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.error(`❌ Error accessing ${table}:`, error);
      } else {
        console.log(`✅ ${table} accessible`);
        console.log(`📊 Sample data:`, data);
      }
    } catch (err) {
      console.error(`❌ Unexpected error with ${table}:`, err);
    }
  }
}

// Test 4: RLS (Row Level Security) Test
async function testRLS() {
  console.log('\n🔒 Test 4: RLS (Row Level Security) Test');
  try {
    // Try to access users table without authentication
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('✅ RLS is working (expected error for unauthenticated access)');
      console.log('📝 Error details:', error);
    } else if (error) {
      console.log('⚠️ RLS might not be configured properly');
      console.log('📝 Error details:', error);
    } else {
      console.log('⚠️ RLS might be disabled (data returned without auth)');
      console.log('📊 Data returned:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Test 5: Environment Variables Check
function checkEnvironmentVariables() {
  console.log('\n🌍 Test 5: Environment Variables Check');
  
  const url = import.meta.env.VITE_SUPABASE_URL || 'Not set';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'Not set';
  
  console.log('🔗 Supabase URL:', url);
  console.log('🔑 Supabase Anon Key:', key ? `${key.substring(0, 20)}...` : 'Not set');
  
  if (url === 'Not set' || key === 'Not set') {
    console.error('❌ Environment variables are not set properly');
    return false;
  }
  
  console.log('✅ Environment variables are set');
  return true;
}

// Test 6: Network Connectivity Test
async function testNetworkConnectivity() {
  console.log('\n🌐 Test 6: Network Connectivity Test');
  try {
    const startTime = Date.now();
    const response = await fetch('https://mbyxrzszontctfluzxwf.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ieXhyenN6b250Y3RmbHV6eHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzcwNDcsImV4cCI6MjA3MDUxMzA0N30.wHKhASCydKGjXwxtnTAIax3eQN2iiPs4j0fpL4pNLkw',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ieXhyenN6b250Y3RmbHV6eHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzcwNDcsImV4cCI6MjA3MDUxMzA0N30.wHKhASCydKGjXwxtnTAIax3eQN2iiPs4j0fpL4pNLkw'
      }
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      console.log(`✅ Network connectivity successful (${responseTime}ms)`);
      return true;
    } else {
      console.error(`❌ Network error: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (err) {
    console.error('❌ Network connectivity failed:', err);
    return false;
  }
}

// Test 7: Schema Validation Test
async function testSchemaValidation() {
  console.log('\n🏗️ Test 7: Schema Validation Test');
  try {
    // Test if the expected columns exist
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Schema validation failed:', error);
      return false;
    }
    
    console.log('✅ Schema validation successful');
    console.log('📊 Sample user data structure:', data);
    return true;
  } catch (err) {
    console.error('❌ Schema validation error:', err);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive database connection tests...\n');
  
  const results = {
    basicConnection: false,
    authentication: false,
    tableAccess: false,
    rls: false,
    envVars: false,
    network: false,
    schema: false
  };
  
  // Run all tests
  results.envVars = checkEnvironmentVariables();
  results.network = await testNetworkConnectivity();
  results.basicConnection = await testBasicConnection();
  results.authentication = await testAuthentication();
  results.tableAccess = await testTableAccess();
  results.rls = await testRLS();
  results.schema = await testSchemaValidation();
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`Basic Connection: ${results.basicConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authentication: ${results.authentication ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Table Access: ${results.tableAccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`RLS: ${results.rls ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Environment Variables: ${results.envVars ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Network Connectivity: ${results.network ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Schema Validation: ${results.schema ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Database connection is working properly.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above for details.');
  }
  
  return results;
}

// Export for use in other files
export { runAllTests, testBasicConnection, testAuthentication };

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testDatabaseConnection = runAllTests;
  console.log('💡 Run testDatabaseConnection() in the console to test the database connection');
}
