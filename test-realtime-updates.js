// Test script for real-time updates
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testRealtimeUpdates() {
  console.log('🧪 Testing Real-time Updates...\n');

  // Check environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables!');
    return;
  }

  console.log('✅ Environment variables found');

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  const testUserId = '550e8400-e29b-41d4-a716-446655440001';

  try {
    // Test 1: Subscribe to real-time changes
    console.log('\n1. Setting up real-time subscription...');
    
    const subscription = supabase
      .channel('test-user-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${testUserId}`
        },
        (payload) => {
          console.log('✅ Real-time update received:', payload.eventType);
          console.log('   New data:', payload.new);
          console.log('   Old data:', payload.old);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_social_links',
          filter: `user_id=eq.${testUserId}`
        },
        (payload) => {
          console.log('✅ Social links real-time update received:', payload.eventType);
          console.log('   New data:', payload.new);
          console.log('   Old data:', payload.old);
        }
      )
      .subscribe();

    console.log('✅ Real-time subscription active');

    // Test 2: Update user data in database
    console.log('\n2. Updating user data in database...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        bio: `Updated bio at ${new Date().toLocaleTimeString()}`,
        phone_number: `+1-555-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      })
      .eq('id', testUserId)
      .select();

    if (updateError) {
      console.log('❌ Error updating user:', updateError.message);
    } else {
      console.log('✅ User updated successfully');
      console.log('   New bio:', updateData[0].bio);
      console.log('   New phone:', updateData[0].phone_number);
    }

    // Test 3: Add a social link
    console.log('\n3. Adding a social link...');
    
    const { data: socialData, error: socialError } = await supabase
      .from('user_social_links')
      .insert({
        user_id: testUserId,
        platform: 'instagram',
        url: 'https://instagram.com/testuser',
        is_public: true
      })
      .select();

    if (socialError) {
      console.log('❌ Error adding social link:', socialError.message);
    } else {
      console.log('✅ Social link added successfully');
      console.log('   Platform:', socialData[0].platform);
      console.log('   URL:', socialData[0].url);
    }

    // Wait a bit for real-time updates
    console.log('\n4. Waiting for real-time updates...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 4: Clean up - remove the test social link
    console.log('\n5. Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('user_social_links')
      .delete()
      .eq('user_id', testUserId)
      .eq('platform', 'instagram');

    if (deleteError) {
      console.log('❌ Error cleaning up:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }

    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Unsubscribe
    supabase.removeChannel(subscription);
    console.log('\n✅ Real-time subscription removed');

    console.log('\n🎉 Real-time test completed!');
    console.log('\nIf you saw real-time updates in the console, the frontend should also receive them.');
    console.log('Check your browser console for similar messages when you update data in the database.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRealtimeUpdates();
