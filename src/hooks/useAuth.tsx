import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url?: string | null;
  profile_picture_url?: string | null;
  bio?: string | null;
  phone_number?: string | null;
  gender?: string | null;
  dob?: string | null;
  timezone?: string | null;
  language_preference?: string | null;
  notification_preferences?: any;
  role?: 'super_admin' | 'school_admin' | 'teacher' | 'student';
  institution_id?: string | null;
  school?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signInWithProvider: (provider: 'google' | 'facebook' | 'linkedin_oidc') => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  setTestUser: (role: 'student' | 'teacher') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to create test users based on role
const createTestUser = (role: 'student' | 'teacher'): { user: User, profile: UserProfile } => {
  // Use the actual UUIDs from the sample data
  const userId = role === 'student' ? '550e8400-e29b-41d4-a716-446655440001' : '550e8400-e29b-41d4-a716-446655440002';
  const email = role === 'student' ? 'student@test.com' : 'teacher@test.com';
  const fullName = role === 'student' ? 'Alex Johnson' : 'Dr. Sarah Chen';
  const institutionId = '1'; // Assuming test users belong to institution 1

  // Use a working placeholder image service
  const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=${role === 'student' ? '3B82F6' : '10B981'}&color=FFFFFF&size=150`;

  return {
    user: {
      id: userId,
      email: email,
      app_metadata: {},
      user_metadata: { full_name: fullName },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: userId,
      email: email,
      full_name: fullName,
      avatar_url: placeholderImage,
      profile_picture_url: placeholderImage,
      bio: role === 'student' ? 'Passionate learner interested in technology and innovation' : 'Experienced educator with expertise in computer science and AI',
      phone_number: role === 'student' ? '+1-555-0001' : '+1-555-0002',
      gender: 'other',
      timezone: 'UTC',
      language_preference: 'en',
      notification_preferences: {
        email: true,
        push: true,
        sms: false
      },
      role: role,
      institution_id: institutionId,
      school: {
        id: institutionId,
        name: 'Tech Academy International',
        logo_url: 'https://ui-avatars.com/api/?name=TAI&background=3B82F6&color=FFFFFF&size=150',
      },
    },
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get user's institution data
      const { data: institutionData, error: institutionError } = await supabase
        .from('user_institutions')
        .select(`
          *,
          institution:institutions(*)
        `)
        .eq('user_id', userId)
        .single();

      // Combine the data
      const profileData: UserProfile = {
        ...userData,
        role: institutionData?.role as any,
        institution_id: institutionData?.institution_id?.toString() || null,
        school: institutionData?.institution ? {
          id: institutionData.institution.id.toString(),
          name: institutionData.institution.name,
          logo_url: institutionData.institution.logo_url
        } : undefined
      };

      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If there's an error, just set the user data without institution
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (!userError) {
          setProfile(userData);
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Real-time subscription for user profile changes
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to user table changes
    const userSubscription = supabase
      .channel('user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        async (payload) => {
          console.log('User profile changed:', payload);
          // Refetch the complete profile when user data changes
          await fetchProfile(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_social_links',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('Social links changed:', payload);
          // Refetch the complete profile when social links change
          await fetchProfile(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_institutions',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('User institution changed:', payload);
          // Refetch the complete profile when institution data changes
          await fetchProfile(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userSubscription);
    };
  }, [user?.id]);

  const signInWithProvider = async (provider: 'google' | 'facebook' | 'linkedin_oidc') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!user) throw new Error('No user logged in');
    
    try {
      // Update the user data
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Get the institution data to maintain the complete profile
      const { data: institutionData } = await supabase
        .from('user_institutions')
        .select(`
          *,
          institution:institutions(*)
        `)
        .eq('user_id', user.id)
        .single();

      // Combine the data
      const profileData: UserProfile = {
        ...updatedUser,
        role: institutionData?.role as any,
        institution_id: institutionData?.institution_id?.toString() || null,
        school: institutionData?.institution ? {
          id: institutionData.institution.id.toString(),
          name: institutionData.institution.name,
          logo_url: institutionData.institution.logo_url
        } : undefined
      };

      setProfile(profileData);
      return profileData;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Function to set test user for bypassing login
  const setTestUser = (role: 'student' | 'teacher') => {
    const { user: tUser, profile: tProfile } = createTestUser(role);
    setUser(tUser);
    setProfile(tProfile);
    setSession({
      access_token: 'test-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'test-refresh-token',
      user: tUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
    setLoading(false);

    // Attempt to load real data from DB to reflect latest profile_picture_url, etc.
    // This works in dev if RLS is relaxed; otherwise it silently falls back to the placeholder.
    (async () => {
      try {
        const { data: userRow, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', tUser.id)
          .single();
        if (!error && userRow) {
          // Preserve existing derived fields like school/role from earlier fetch if present
          setProfile((prev) => ({
            ...(prev || {} as any),
            ...userRow,
          }));
        }
      } catch (e) {
        // ignore in test mode
      }
    })();
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signInWithProvider,
      signOut,
      updateProfile,
      setTestUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}