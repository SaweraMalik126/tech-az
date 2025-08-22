import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';

interface InvitationData {
  id: string;
  course_id: number;
  course_name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitation_token: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
  max_uses: number;
  current_uses: number;
  message?: string;
}

interface CourseData {
  id: number;
  name: string;
  description: string;
  thumbnail_url?: string;
  estimated_duration: number;
  difficulty_level: string;
  tags: string[];
}

const InvitationAcceptance: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, profile, signInWithOAuth, updateProfile } = useAuth();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'loading' | 'invitation' | 'signup' | 'signin' | 'complete'>('loading');
  
  // Form states
  const [signupForm, setSignupForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_number: '',
    institute_name: ''
  });
  
  const [signinForm, setSigninForm] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      
      // Fetch invitation details
      const { data: invitationData, error: invitationError } = await supabase
        .from('invitations')
        .select(`
          *,
          courses (
            id,
            name,
            description,
            thumbnail_url,
            estimated_duration,
            difficulty_level,
            tags
          )
        `)
        .eq('invitation_token', token)
        .single();

      if (invitationError) throw invitationError;

      if (!invitationData) {
        setError('Invitation not found');
        setStep('invitation');
        return;
      }

      // Check if invitation is expired
      if (new Date(invitationData.expires_at) < new Date()) {
        setError('This invitation has expired');
        setStep('invitation');
        return;
      }

      // Check if invitation is already used up
      if (invitationData.current_uses >= invitationData.max_uses) {
        setError('This invitation has reached its maximum usage limit');
        setStep('invitation');
        return;
      }

      // Check if invitation is cancelled
      if (invitationData.status === 'cancelled') {
        setError('This invitation has been cancelled');
        setStep('invitation');
        return;
      }

      // Check if user is already enrolled
      if (invitationData.status === 'accepted') {
        setError('This invitation has already been accepted');
        setStep('invitation');
        return;
      }

      setInvitation(invitationData);
      setCourse(invitationData.courses);
      
      // Pre-fill email if invitation has one
      if (invitationData.email) {
        setSignupForm(prev => ({ ...prev, email: invitationData.email }));
        setSigninForm(prev => ({ ...prev, email: invitationData.email }));
      }

      // Check if user is already signed in
      if (user) {
        if (user.email === invitationData.email) {
          // User is signed in with the invited email, proceed to accept
          await acceptInvitation();
        } else {
          // User is signed in with different email
          setError('This invitation is for a different email address. Please sign out and sign in with the correct email.');
          setStep('invitation');
        }
      } else {
        setStep('invitation');
      }

    } catch (error) {
      console.error('Error validating invitation:', error);
      setError('Failed to validate invitation. Please try again.');
      setStep('invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation || !user) return;

    try {
      setProcessing(true);

      // Update invitation status
      const { error: invitationError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          current_uses: invitation.current_uses + 1,
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (invitationError) throw invitationError;

      // Enroll user in course
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: invitation.course_id,
          role: invitation.role,
          enrolled_at: new Date().toISOString(),
          status: 'active'
        });

      if (enrollmentError) throw enrollmentError;

      // Create user progress record
      const { error: progressError } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          course_id: invitation.course_id,
          current_chapter: 1,
          progress_percentage: 0,
          time_spent: 0,
          last_accessed: new Date().toISOString()
        });

      if (progressError) throw progressError;

      // Update user profile with institute if provided
      if (invitation.role === 'student' && profile?.institute_name !== invitation.invited_by) {
        await updateProfile({
          institute_name: invitation.invited_by
        });
      }

      toast({
        title: "Welcome to the course!",
        description: `You have been successfully enrolled in ${course?.name}`,
      });

      setStep('complete');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password !== signupForm.confirm_password) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          data: {
            full_name: signupForm.full_name,
            phone_number: signupForm.phone_number,
            institute_name: signupForm.institute_name
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // User created successfully, now accept invitation
        await acceptInvitation();
      }

    } catch (error) {
      console.error('Error during signup:', error);
      toast({
        title: "Signup Failed",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setProcessing(true);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: signinForm.email,
        password: signinForm.password
      });

      if (authError) throw authError;

      if (authData.user) {
        // User signed in successfully, now accept invitation
        await acceptInvitation();
      }

    } catch (error) {
      console.error('Error during signin:', error);
      toast({
        title: "Sign In Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSocialSignin = async (provider: 'google' | 'facebook' | 'linkedin') => {
    try {
      setProcessing(true);
      await signInWithOAuth(provider);
    } catch (error) {
      console.error('Error during social signin:', error);
      toast({
        title: "Sign In Failed",
        description: "Failed to sign in with social provider. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invitation Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Welcome to TeachMe.ai!</h2>
            <p className="text-muted-foreground mb-6">
              You have been successfully enrolled in {course?.name}
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Course Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <span>Course Invitation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course && (
                  <>
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="text-lg font-semibold">{course.name}</h3>
                        <p className="text-sm text-muted-foreground">{course.description}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Duration:</span>
                        <p className="text-muted-foreground">{course.estimated_duration} hours</p>
                      </div>
                      <div>
                        <span className="font-medium">Level:</span>
                        <p className="text-muted-foreground capitalize">{course.difficulty_level}</p>
                      </div>
                    </div>
                    
                    {course.tags && course.tags.length > 0 && (
                      <div>
                        <span className="font-medium text-sm">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {course.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Role:</span>
                    <Badge variant="outline">{invitation?.role}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Expires:</span>
                    <span className="text-muted-foreground">
                      {invitation?.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Uses:</span>
                    <span className="text-muted-foreground">
                      {invitation?.current_uses}/{invitation?.max_uses}
                    </span>
                  </div>
                </div>
                
                {invitation?.message && (
                  <>
                    <Separator />
                    <div>
                      <span className="font-medium text-sm">Personal Message:</span>
                      <p className="text-muted-foreground text-sm mt-1">{invitation.message}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Authentication */}
          <div className="space-y-6">
            {step === 'invitation' && (
              <Card>
                <CardHeader>
                  <CardTitle>Join the Course</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    You've been invited to join {course?.name}. Please sign in or create an account to continue.
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setStep('signin')} 
                      className="w-full"
                      variant="outline"
                    >
                      I already have an account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    <Button 
                      onClick={() => setStep('signup')} 
                      className="w-full"
                    >
                      Create new account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">Or continue with</p>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleSocialSignin('google')}
                        disabled={processing}
                        className="w-full"
                      >
                        Google
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSocialSignin('facebook')}
                        disabled={processing}
                        className="w-full"
                      >
                        Facebook
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSocialSignin('linkedin')}
                        disabled={processing}
                        className="w-full"
                      >
                        LinkedIn
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'signup' && (
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={signupForm.full_name}
                        onChange={(e) => setSignupForm({ ...signupForm, full_name: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                        className="mt-1"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This email is set by your invitation
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone_number">Phone Number (Optional)</Label>
                      <Input
                        id="phone_number"
                        value={signupForm.phone_number}
                        onChange={(e) => setSignupForm({ ...signupForm, phone_number: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="institute_name">Institute Name (Optional)</Label>
                      <Input
                        id="institute_name"
                        value={signupForm.institute_name}
                        onChange={(e) => setSignupForm({ ...signupForm, institute_name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm_password">Confirm Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirm_password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={signupForm.confirm_password}
                          onChange={(e) => setSignupForm({ ...signupForm, confirm_password: e.target.value })}
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('invitation')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button type="submit" disabled={processing} className="flex-1">
                        {processing ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === 'signin' && (
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignin} className="space-y-4">
                    <div>
                      <Label htmlFor="signin_email">Email</Label>
                      <Input
                        id="signin_email"
                        type="email"
                        value={signinForm.email}
                        onChange={(e) => setSigninForm({ ...signinForm, email: e.target.value })}
                        required
                        className="mt-1"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This email is set by your invitation
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="signin_password">Password</Label>
                      <Input
                        id="signin_password"
                        type="password"
                        value={signinForm.password}
                        onChange={(e) => setSigninForm({ ...signinForm, password: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('invitation')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button type="submit" disabled={processing} className="flex-1">
                        {processing ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationAcceptance; 