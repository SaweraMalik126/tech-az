import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CompletedCourse {
  id: number;
  title: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  difficulty_level: string;
  estimated_duration_hours: number;
  completed_at: string;
  grade: string;
  feedback: string;
  completion_certificate_url: string;
  total_content_items: number;
  completed_content_items: number;
  completion_percentage: number;
  tags: string[];
}

export function useCompletedCourses() {
  const { profile } = useAuth();
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletedCourses = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch completed enrollments with course details
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (enrollmentError) throw enrollmentError;

      // Fetch course tags for each course
      const coursesWithTags = await Promise.all(
        enrollments.map(async (enrollment) => {
          const { data: tags } = await supabase
            .from('course_tags')
            .select('tag')
            .eq('course_id', enrollment.course.id);

          // Fetch progress for this course
          const { data: progress } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', profile.id)
            .eq('course_id', enrollment.course.id);

          const totalContentItems = progress?.length || 0;
          const completedContentItems = progress?.filter(p => p.status === 'completed').length || 0;
          const completionPercentage = totalContentItems > 0 ? Math.round((completedContentItems / totalContentItems) * 100) : 0;

          return {
            id: enrollment.course.id,
            title: enrollment.course.title,
            description: enrollment.course.description,
            short_description: enrollment.course.short_description,
            thumbnail_url: enrollment.course.thumbnail_url,
            difficulty_level: enrollment.course.difficulty_level,
            estimated_duration_hours: enrollment.course.estimated_duration_hours,
            completed_at: enrollment.completed_at,
            grade: enrollment.grade,
            feedback: enrollment.feedback,
            completion_certificate_url: enrollment.completion_certificate_url,
            total_content_items: totalContentItems,
            completed_content_items: completedContentItems,
            completion_percentage: completionPercentage,
            tags: tags?.map(t => t.tag) || []
          };
        })
      );

      setCompletedCourses(coursesWithTags);
    } catch (err) {
      console.error('Error fetching completed courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch completed courses');
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription for enrollment changes
  useEffect(() => {
    if (!profile?.id) return;

    const subscription = supabase
      .channel('completed-courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrollments',
          filter: `user_id=eq.${profile.id}`
        },
        async (payload) => {
          console.log('Enrollment changed:', payload);
          // Refetch completed courses when enrollments change
          await fetchCompletedCourses();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${profile.id}`
        },
        async (payload) => {
          console.log('Progress changed:', payload);
          // Refetch completed courses when progress changes
          await fetchCompletedCourses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile?.id]);

  // Fetch completed courses when profile changes
  useEffect(() => {
    if (profile?.id) {
      fetchCompletedCourses();
    }
  }, [profile?.id]);

  const getCourseById = (courseId: number) => {
    return completedCourses.find(course => course.id === courseId);
  };

  const getCoursesByTag = (tag: string) => {
    return completedCourses.filter(course => course.tags.includes(tag));
  };

  const getCoursesByDifficulty = (difficulty: string) => {
    return completedCourses.filter(course => course.difficulty_level === difficulty);
  };

  return {
    completedCourses,
    loading,
    error,
    fetchCompletedCourses,
    getCourseById,
    getCoursesByTag,
    getCoursesByDifficulty
  };
}
