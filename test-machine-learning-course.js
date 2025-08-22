// Test script for Machine Learning course
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testMachineLearningCourse() {
  console.log('🧪 Testing Machine Learning Course Setup...\n');

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

  try {
    // Test 1: Check if the course exists
    console.log('\n1. Checking Machine Learning course...');
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('title', 'Machine Learning')
      .single();

    if (courseError) {
      console.log('❌ Error fetching course:', courseError.message);
    } else if (course) {
      console.log('✅ Course found:');
      console.log('   ID:', course.id);
      console.log('   Title:', course.title);
      console.log('   Status:', course.status);
      console.log('   Difficulty:', course.difficulty_level);
      console.log('   Duration:', course.estimated_duration_hours, 'hours');
      console.log('   Description:', course.description.substring(0, 100) + '...');
    } else {
      console.log('⚠️ Course not found');
    }

    // Test 2: Check course tags
    console.log('\n2. Checking course tags...');
    const { data: tags, error: tagsError } = await supabase
      .from('course_tags')
      .select('*')
      .eq('course_id', 3);

    if (tagsError) {
      console.log('❌ Error fetching tags:', tagsError.message);
    } else if (tags && tags.length > 0) {
      console.log(`✅ Found ${tags.length} course tags:`);
      tags.forEach(tag => {
        console.log('   -', tag.tag);
      });
    } else {
      console.log('⚠️ No course tags found');
    }

    // Test 3: Check course chapters
    console.log('\n3. Checking course chapters...');
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('*')
      .eq('course_id', 3)
      .order('position');

    if (chaptersError) {
      console.log('❌ Error fetching chapters:', chaptersError.message);
    } else if (chapters && chapters.length > 0) {
      console.log(`✅ Found ${chapters.length} chapters:`);
      chapters.forEach(chapter => {
        console.log(`   ${chapter.position}. ${chapter.title} (${chapter.estimated_duration_minutes} min)`);
      });
    } else {
      console.log('⚠️ No chapters found');
    }

    // Test 4: Check course content items
    console.log('\n4. Checking course content items...');
    const { data: contentItems, error: contentError } = await supabase
      .from('content_items')
      .select('*')
      .in('chapter_id', chapters?.map(c => c.id) || [])
      .order('chapter_id, position');

    if (contentError) {
      console.log('❌ Error fetching content items:', contentError.message);
    } else if (contentItems && contentItems.length > 0) {
      console.log(`✅ Found ${contentItems.length} content items:`);
      contentItems.forEach(item => {
        console.log(`   - ${item.title} (${item.type}, ${item.duration_estimate_seconds}s)`);
      });
    } else {
      console.log('⚠️ No content items found');
    }

    // Test 5: Check student enrollment
    console.log('\n5. Checking student enrollment...');
    const testUserId = '550e8400-e29b-41d4-a716-446655440001';
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', testUserId)
      .eq('course_id', 3)
      .single();

    if (enrollmentError) {
      console.log('❌ Error fetching enrollment:', enrollmentError.message);
    } else if (enrollment) {
      console.log('✅ Enrollment found:');
      console.log('   Status:', enrollment.status);
      console.log('   Role:', enrollment.role);
      console.log('   Enrolled at:', enrollment.enrolled_at);
      console.log('   Completed at:', enrollment.completed_at);
      console.log('   Grade:', enrollment.grade);
      console.log('   Feedback:', enrollment.feedback);
    } else {
      console.log('⚠️ No enrollment found');
    }

    // Test 6: Check user progress
    console.log('\n6. Checking user progress...');
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', testUserId)
      .eq('course_id', 3);

    if (progressError) {
      console.log('❌ Error fetching progress:', progressError.message);
    } else if (progress && progress.length > 0) {
      console.log(`✅ Found ${progress.length} progress records:`);
      const completedItems = progress.filter(p => p.status === 'completed');
      const totalItems = progress.length;
      const completionPercentage = Math.round((completedItems.length / totalItems) * 100);
      
      console.log(`   Total content items: ${totalItems}`);
      console.log(`   Completed items: ${completedItems.length}`);
      console.log(`   Completion percentage: ${completionPercentage}%`);
      
      progress.forEach(p => {
        console.log(`   - ${p.status}: ${p.completion_percentage}% (${p.time_spent_seconds}s)`);
      });
    } else {
      console.log('⚠️ No progress records found');
    }

    // Test 7: Check course review
    console.log('\n7. Checking course review...');
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', testUserId)
      .eq('course_id', 3)
      .single();

    if (reviewError) {
      console.log('❌ Error fetching review:', reviewError.message);
    } else if (review) {
      console.log('✅ Course review found:');
      console.log('   Rating:', review.rating, '/ 5');
      console.log('   Review:', review.review_text.substring(0, 100) + '...');
      console.log('   Type:', review.review_type);
      console.log('   Public:', review.is_public);
    } else {
      console.log('⚠️ No course review found');
    }

    // Test 8: Check course teacher assignment
    console.log('\n8. Checking course teacher assignment...');
    const { data: teacher, error: teacherError } = await supabase
      .from('course_teachers')
      .select(`
        *,
        teacher:users(full_name, email)
      `)
      .eq('course_id', 3)
      .eq('is_primary', true)
      .single();

    if (teacherError) {
      console.log('❌ Error fetching teacher:', teacherError.message);
    } else if (teacher) {
      console.log('✅ Course teacher found:');
      console.log('   Teacher:', teacher.teacher?.full_name);
      console.log('   Email:', teacher.teacher?.email);
      console.log('   Is Primary:', teacher.is_primary);
    } else {
      console.log('⚠️ No course teacher found');
    }

    console.log('\n🎉 Machine Learning course test completed!');
    console.log('\nSummary:');
    console.log('- Course should be published and available');
    console.log('- Student should be enrolled as completed');
    console.log('- All content items should be marked as completed');
    console.log('- Course should have a 5-star review');
    console.log('- Teacher should be assigned to the course');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMachineLearningCourse();
