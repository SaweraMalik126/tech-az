// Simple test script to verify the backend API
// Run this after starting the backend server

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`   Endpoint: ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Success: ${response.status}`);
      console.log(`   📊 Response:`, data);
    } else {
      console.log(`   ❌ Error: ${response.status}`);
      console.log(`   📝 Message:`, data.message);
    }
  } catch (error) {
    console.log(`   💥 Network Error:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  // Test health check
  await testEndpoint('/', 'Health Check');
  
  // Test students endpoint
  await testEndpoint('/api/students', 'Get All Students');
  
  // Test specific student
  await testEndpoint('/api/students/550e8400-e29b-41d4-a716-446655440001', 'Get Student by ID');
  
  // Test student progress
  await testEndpoint('/api/students/550e8400-e29b-41d4-a716-446655440001/progress', 'Get Student Progress');
  
  // Test course students
  await testEndpoint('/api/courses/1/students', 'Get Students by Course');
  
  // Test search
  await testEndpoint('/api/students/search?q=alex', 'Search Students');
  
  // Test invalid endpoint
  await testEndpoint('/api/nonexistent', '404 Handler');
  
  console.log('\n✨ API Tests Complete!');
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  runTests();
}

module.exports = { runTests };
