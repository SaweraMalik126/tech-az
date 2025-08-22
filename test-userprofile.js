// Test script for UserProfile functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testUserProfile() {
  console.log('🧪 Testing UserProfile Setup...\n');

  // Check environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables!');
    console.log('Please check your .env file contains:');
    console.log('VITE_SUPABASE_URL=your_supabase_url');
    console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
    return;
  }

  console.log('✅ Environment variables found');

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Check if test users exist
    console.log('\n1. Checking test users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('email', ['student@test.com', 'teacher@test.com']);

    if (usersError) {
      console.log('❌ Error fetching test users:', usersError.message);
    } else if (users && users.length > 0) {
      console.log(`✅ Found ${users.length} test users:`);
      users.forEach(user => {
        console.log(`   - ${user.email}: ${user.full_name}`);
        console.log(`     Bio: ${user.bio || 'No bio'}`);
        console.log(`     Phone: ${user.phone_number || 'No phone'}`);
      });
    } else {
      console.log('⚠️ No test users found');
    }

    // Test 2: Check social links
    console.log('\n2. Checking social links...');
    const { data: socialLinks, error: socialError } = await supabase
      .from('user_social_links')
      .select('*');

    if (socialError) {
      console.log('❌ Error fetching social links:', socialError.message);
    } else if (socialLinks && socialLinks.length > 0) {
      console.log(`✅ Found ${socialLinks.length} social links:`);
      socialLinks.forEach(link => {
        console.log(`   - ${link.platform}: ${link.url}`);
      });
    } else {
      console.log('⚠️ No social links found');
    }

    // Test 3: Check institutions
    console.log('\n3. Checking institutions...');
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('*');

    if (instError) {
      console.log('❌ Error fetching institutions:', instError.message);
    } else if (institutions && institutions.length > 0) {
      console.log(`✅ Found ${institutions.length} institutions:`);
      institutions.forEach(inst => {
        console.log(`   - ${inst.name}: ${inst.contact_email}`);
      });
    } else {
      console.log('⚠️ No institutions found');
    }

    // Test 4: Check user-institution relationships
    console.log('\n4. Checking user-institution relationships...');
    const { data: userInsts, error: userInstError } = await supabase
      .from('user_institutions')
      .select(`
        *,
        user:users(full_name, email),
        institution:institutions(name)
      `);

    if (userInstError) {
      console.log('❌ Error fetching user-institution relationships:', userInstError.message);
    } else if (userInsts && userInsts.length > 0) {
      console.log(`✅ Found ${userInsts.length} user-institution relationships:`);
      userInsts.forEach(rel => {
        console.log(`   - ${rel.user?.full_name} (${rel.user?.email}) is ${rel.role} at ${rel.institution?.name}`);
      });
    } else {
      console.log('⚠️ No user-institution relationships found');
    }

    // Test 5: Check storage bucket
    console.log('\n5. Checking storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Storage error:', bucketError.message);
    } else {
      const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars');
      if (avatarsBucket) {
        console.log('✅ Avatars storage bucket found');
        console.log(`   - Public: ${avatarsBucket.public}`);
        console.log(`   - File size limit: ${avatarsBucket.file_size_limit} bytes`);
      } else {
        console.log('⚠️ Avatars bucket not found');
      }
    }

    // Test 6: Test profile update (simulation)
    console.log('\n6. Testing profile update simulation...');
    const testUserId = '550e8400-e29b-41d4-a716-446655440001';
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUserId)
        .single();

      if (userError) {
        console.log('❌ Error fetching user:', userError.message);
      } else {
        console.log('✅ User data accessible');
        console.log('   Name:', userData.full_name);
        console.log('   Email:', userData.email);
        console.log('   Bio:', userData.bio || 'No bio');
        console.log('   Phone:', userData.phone_number || 'No phone');
        console.log('   Gender:', userData.gender || 'Not specified');
        console.log('   Language:', userData.language_preference || 'Not specified');
      }
    } catch (error) {
      console.log('❌ User fetch error:', error.message);
    }

    console.log('\n🎉 UserProfile test completed!');
    console.log('\nIf you see any ❌ errors, please:');
    console.log('1. Run the SQL script in Supabase SQL Editor');
    console.log('2. Check your environment variables');
    console.log('3. Verify your Supabase project is active');
    console.log('\nIf everything shows ✅, your UserProfile is ready to use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUserProfile();
// Test script for UserProfile functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testUserProfile() {
  console.log('🧪 Testing UserProfile Setup...\n');

  // Check environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables!');
    console.log('Please check your .env file contains:');
    console.log('VITE_SUPABASE_URL=your_supabase_url');
    console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
    return;
  }

  console.log('✅ Environment variables found');

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Check if test users exist
    console.log('\n1. Checking test users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('email', ['student@test.com', 'teacher@test.com']);

    if (usersError) {
      console.log('❌ Error fetching test users:', usersError.message);
    } else if (users && users.length > 0) {
      console.log(`✅ Found ${users.length} test users:`);
      users.forEach(user => {
        console.log(`   - ${user.email}: ${user.full_name}`);
        console.log(`     Bio: ${user.bio || 'No bio'}`);
        console.log(`     Phone: ${user.phone_number || 'No phone'}`);
      });
    } else {
      console.log('⚠️ No test users found');
    }

    // Test 2: Check social links
    console.log('\n2. Checking social links...');
    const { data: socialLinks, error: socialError } = await supabase
      .from('user_social_links')
      .select('*');

    if (socialError) {
      console.log('❌ Error fetching social links:', socialError.message);
    } else if (socialLinks && socialLinks.length > 0) {
      console.log(`✅ Found ${socialLinks.length} social links:`);
      socialLinks.forEach(link => {
        console.log(`   - ${link.platform}: ${link.url}`);
      });
    } else {
      console.log('⚠️ No social links found');
    }

    // Test 3: Check institutions
    console.log('\n3. Checking institutions...');
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('*');

    if (instError) {
      console.log('❌ Error fetching institutions:', instError.message);
    } else if (institutions && institutions.length > 0) {
      console.log(`✅ Found ${institutions.length} institutions:`);
      institutions.forEach(inst => {
        console.log(`   - ${inst.name}: ${inst.contact_email}`);
      });
    } else {
      console.log('⚠️ No institutions found');
    }

    // Test 4: Check user-institution relationships
    console.log('\n4. Checking user-institution relationships...');
    const { data: userInsts, error: userInstError } = await supabase
      .from('user_institutions')
      .select(`
        *,
        user:users(full_name, email),
        institution:institutions(name)
      `);

    if (userInstError) {
      console.log('❌ Error fetching user-institution relationships:', userInstError.message);
    } else if (userInsts && userInsts.length > 0) {
      console.log(`✅ Found ${userInsts.length} user-institution relationships:`);
      userInsts.forEach(rel => {
        console.log(`   - ${rel.user?.full_name} (${rel.user?.email}) is ${rel.role} at ${rel.institution?.name}`);
      });
    } else {
      console.log('⚠️ No user-institution relationships found');
    }

    // Test 5: Check storage bucket
    console.log('\n5. Checking storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Storage error:', bucketError.message);
    } else {
      const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars');
      if (avatarsBucket) {
        console.log('✅ Avatars storage bucket found');
        console.log(`   - Public: ${avatarsBucket.public}`);
        console.log(`   - File size limit: ${avatarsBucket.file_size_limit} bytes`);
      } else {
        console.log('⚠️ Avatars bucket not found');
      }
    }

    // Test 6: Test profile update (simulation)
    console.log('\n6. Testing profile update simulation...');
    const testUserId = '550e8400-e29b-41d4-a716-446655440001';
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUserId)
        .single();

      if (userError) {
        console.log('❌ Error fetching user:', userError.message);
      } else {
        console.log('✅ User data accessible');
        console.log('   Name:', userData.full_name);
        console.log('   Email:', userData.email);
        console.log('   Bio:', userData.bio || 'No bio');
        console.log('   Phone:', userData.phone_number || 'No phone');
        console.log('   Gender:', userData.gender || 'Not specified');
        console.log('   Language:', userData.language_preference || 'Not specified');
      }
    } catch (error) {
      console.log('❌ User fetch error:', error.message);
    }

    console.log('\n🎉 UserProfile test completed!');
    console.log('\nIf you see any ❌ errors, please:');
    console.log('1. Run the SQL script in Supabase SQL Editor');
    console.log('2. Check your environment variables');
    console.log('3. Verify your Supabase project is active');
    console.log('\nIf everything shows ✅, your UserProfile is ready to use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUserProfile();
