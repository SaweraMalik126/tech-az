import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Assignment } from './useCourses';

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student_id: string;
  content: any;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  student?: {
    full_name: string;
    email: string;
  };
}

export function useAssignments(courseId?: number) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile && courseId) {
      console.log('useAssignments: Profile and courseId available, fetching assignments for course:', courseId);
      fetchAssignments();
      if (profile.role === 'teacher') {
        console.log('useAssignments: Teacher role detected, fetching submissions');
        fetchSubmissions();
      }
    } else {
      console.log('useAssignments: Waiting for profile or courseId. Profile:', !!profile, 'CourseId:', courseId);
    }
  }, [profile, courseId]);

  const fetchAssignments = async () => {
    if (!courseId) {
      console.log('useAssignments: No courseId provided, cannot fetch assignments');
      return;
    }

    try {
      console.log('useAssignments: Starting to fetch assignments for course:', courseId);
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('useAssignments: Error fetching assignments:', fetchError);
        throw fetchError;
      }

      console.log('useAssignments: Raw assignments data:', data);

      // For teachers, get submission counts and average scores
      if (profile?.role === 'teacher') {
        console.log('useAssignments: Teacher role, fetching submission stats...');
        const assignmentsWithStats = await Promise.all(
          (data || []).map(async (assignment) => {
            const { data: submissionData, error: submissionError } = await supabase
              .from('assignment_submissions')
              .select('*')
              .eq('assignment_id', assignment.id);

            if (submissionError) {
              console.error('useAssignments: Error fetching submissions for assignment', assignment.id, ':', submissionError);
              return { ...assignment, submission_count: 0, graded_count: 0, average_score: null };
            }

            const submissions = submissionData || [];
            const gradedSubmissions = submissions.filter(s => s.grade !== null);
            const averageScore = gradedSubmissions.length > 0
              ? submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
              : null;

            console.log(`useAssignments: Assignment ${assignment.id} stats - submissions: ${submissions.length}, graded: ${gradedSubmissions.length}, avg: ${averageScore}`);

            return {
              ...assignment,
              submission_count: submissions.length,
              graded_count: gradedSubmissions.length,
              average_score: averageScore
            };
          })
        );

        console.log('useAssignments: Assignments with stats loaded:', assignmentsWithStats);
        setAssignments(assignmentsWithStats);
      } else {
        console.log('useAssignments: Student role, setting assignments without stats:', data);
        setAssignments(data || []);
      }
    } catch (err) {
      console.error('useAssignments: Error in fetchAssignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!courseId || profile?.role !== 'teacher') {
      console.log('useAssignments: Cannot fetch submissions - courseId:', courseId, 'role:', profile?.role);
      return;
    }

    try {
      console.log('useAssignments: Fetching submissions for course:', courseId);
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          student:users(full_name, email)
        `)
        .in('assignment_id', assignments.map(a => a.id))
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('useAssignments: Error fetching submissions:', error);
        throw error;
      }
      
      console.log('useAssignments: Submissions loaded:', data);
      setSubmissions(data || []);
    } catch (err) {
      console.error('useAssignments: Error in fetchSubmissions:', err);
    }
  };

  const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'submission_count' | 'graded_count' | 'average_score' | 'status'>) => {
    try {
      console.log('useAssignments: Creating new assignment:', assignmentData);
      const { data, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select()
        .single();

      if (error) throw error;
      
      console.log('useAssignments: Assignment created successfully:', data);
      await fetchAssignments();
      return data;
    } catch (err) {
      console.error('useAssignments: Error creating assignment:', err);
      throw err;
    }
  };

  const updateAssignment = async (id: number, updates: Partial<Assignment>) => {
    try {
      console.log('useAssignments: Updating assignment:', id, 'with updates:', updates);
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('useAssignments: Assignment updated successfully:', data);
      await fetchAssignments();
      return data;
    } catch (err) {
      console.error('useAssignments: Error updating assignment:', err);
      throw err;
    }
  };

  const deleteAssignment = async (id: number) => {
    try {
      console.log('useAssignments: Deleting assignment:', id);
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log('useAssignments: Assignment deleted successfully');
      await fetchAssignments();
    } catch (err) {
      console.error('useAssignments: Error deleting assignment:', err);
      throw err;
    }
  };

  const submitAssignment = async (assignmentId: number, content: any) => {
    if (!profile) throw new Error('User not authenticated');

    try {
      console.log('useAssignments: Submitting assignment:', assignmentId, 'with content:', content);
      const { data, error } = await supabase
        .from('assignment_submissions')
        .insert([{
          assignment_id: assignmentId,
          student_id: profile.id,
          content,
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('useAssignments: Assignment submitted successfully:', data);
      return data;
    } catch (err) {
      console.error('useAssignments: Error submitting assignment:', err);
      throw err;
    }
  };

  const gradeSubmission = async (submissionId: number, grade: number, feedback: string) => {
    try {
      console.log('useAssignments: Grading submission:', submissionId, 'with grade:', grade, 'and feedback:', feedback);
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({ grade, feedback })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      
      console.log('useAssignments: Submission graded successfully:', data);
      await fetchSubmissions();
      return data;
    } catch (err) {
      console.error('useAssignments: Error grading submission:', err);
      throw err;
    }
  };

  return {
    assignments,
    submissions,
    loading,
    error,
    fetchAssignments,
    fetchSubmissions,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    gradeSubmission,
    refresh: fetchAssignments
  };
} 