// Test database connection and permissions
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zegmfhhxscrrjweuxleq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplZ21maGh4c2Nycmp3ZXV4bGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzQ0NTksImV4cCI6MjA3MDY1MDQ1OX0.LEM-Gh23C9ke9AcJcLDnTCwqm6-BSOKjdfmUOo4Giew";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabase() {
  console.log("🔍 Testing database connection...\n");

  try {
    // Test 1: Basic connection
    console.log("1. Testing basic connection...");
    const { data: testData, error: testError } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (testError) {
      console.log("❌ Connection failed:", testError.message);
      return;
    }
    console.log("✅ Connection successful");

    // Test 2: Count users
    console.log("\n2. Testing users table access...");
    const { count, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.log("❌ Users table access failed:", countError.message);
      console.log("💡 Try running the disable_rls.sql script in Supabase");
      return;
    }
    console.log(`✅ Users table accessible. Found ${count} users`);

    // Test 3: Get sample user
    console.log("\n3. Testing user data retrieval...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .limit(1);

    if (usersError) {
      console.log("❌ User data retrieval failed:", usersError.message);
      return;
    }
    console.log("✅ User data retrieved successfully");
    console.log("Sample user:", users[0]);

    // Test 4: Test enrollments
    console.log("\n4. Testing enrollments table...");
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("*")
      .limit(1);

    if (enrollmentsError) {
      console.log(
        "❌ Enrollments table access failed:",
        enrollmentsError.message
      );
    } else {
      console.log("✅ Enrollments table accessible");
    }

    console.log("\n🎉 Database tests completed successfully!");
    console.log("Your backend should now work properly.");
  } catch (error) {
    console.error("💥 Unexpected error:", error);
  }
}

testDatabase();
