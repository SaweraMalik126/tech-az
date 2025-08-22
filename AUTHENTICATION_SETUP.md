# Authentication Setup Guide for TeachMe.ai

This guide provides step-by-step instructions for implementing OAuth authentication with Google, Facebook, and LinkedIn using Supabase Auth.

## 🔐 Overview

TeachMe.ai uses Supabase Auth for secure, scalable authentication. The system supports:
- **Social OAuth**: Google, Facebook, LinkedIn
- **Email/Password**: Traditional authentication
- **Invitation-based**: Secure user onboarding
- **Role-based Access Control**: Multi-tenant user management

## 🚀 Quick Setup

### 1. Supabase Project Configuration

#### A. Enable Auth Providers
In your Supabase dashboard:
1. Go to **Authentication** > **Providers**
2. Enable the providers you want to use:
   - Google
   - Facebook
   - LinkedIn
   - Email

#### B. Configure Site URL
1. Go to **Authentication** > **Settings**
2. Set **Site URL** to your domain (e.g., `https://yourdomain.com`)
3. Add additional redirect URLs for development:
   - `http://localhost:5173`
   - `http://localhost:3000`

### 2. OAuth Provider Setup

#### Google OAuth

1. **Create Google Cloud Project**
   ```bash
   # Go to https://console.cloud.google.com
   # Create new project or select existing
   ```

2. **Enable APIs**
   - Go to **APIs & Services** > **Library**
   - Search for and enable:
     - Google+ API
     - Google Identity and Access Management (IAM) API

3. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth 2.0 Client IDs**
   - Choose **Web application**
   - Add authorized redirect URIs:
     ```
     https://your-project.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     ```

4. **Configure Supabase**
   - Copy **Client ID** and **Client Secret**
   - In Supabase: **Authentication** > **Providers** > **Google**
   - Paste credentials and enable

#### Facebook OAuth

1. **Create Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com)
   - Click **Create App**
   - Choose **Consumer** app type

2. **Add Facebook Login**
   - In your app dashboard, click **Add Product**
   - Select **Facebook Login**
   - Choose **Web** platform

3. **Configure OAuth Settings**
   - Go to **Facebook Login** > **Settings**
   - Add OAuth redirect URIs:
     ```
     https://your-project.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     ```

4. **Get App Credentials**
   - Note your **App ID** and **App Secret**
   - In Supabase: **Authentication** > **Providers** > **Facebook**
   - Paste credentials and enable

#### LinkedIn OAuth

1. **Create LinkedIn App**
   - Go to [LinkedIn Developers](https://www.linkedin.com/developers)
   - Click **Create App**
   - Fill in app details

2. **Configure OAuth 2.0**
   - Go to **Auth** tab
   - Add redirect URIs:
     ```
     https://your-project.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     ```

3. **Get Client Credentials**
   - Note your **Client ID** and **Client Secret**
   - In Supabase: **Authentication** > **Providers** > **LinkedIn**
   - Paste credentials and enable

## 🔧 Implementation Details

### 1. Environment Variables

Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_key
```

### 2. Supabase Client Configuration

The client is already configured in `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### 3. Authentication Hook

The `useAuth` hook (`src/hooks/useAuth.tsx`) provides:

```typescript
const {
  user,           // Current user object
  profile,        // User profile with role
  session,        // Current session
  loading,        // Loading state
  signInWithProvider,  // OAuth sign-in
  signOut,        // Sign out
  updateProfile,  // Update profile
  setTestUser     // Test login (dev only)
} = useAuth()
```

### 4. OAuth Sign-In Flow

```typescript
const handleSocialLogin = async (provider: 'google' | 'facebook' | 'linkedin_oidc') => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('OAuth error:', error);
  }
};
```

## 🎯 Invitation-Based Authentication

### 1. Database Schema

The system includes invitation tables:
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  institution_id INTEGER REFERENCES institutions(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

### 2. Invitation Flow

1. **Admin creates invitation**
   ```typescript
   const createInvitation = async (email: string, role: string, institutionId: number) => {
     const token = generateSecureToken();
     const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
     
     const { data, error } = await supabase
       .from('invitations')
       .insert({
         email,
         role,
         institution_id: institutionId,
         token,
         expires_at: expiresAt
       });
     
     if (!error) {
       await sendInvitationEmail(email, token);
     }
   };
   ```

2. **User clicks invitation link**
   ```typescript
   // URL: /invite?token=abc123
   const validateInvitation = async (token: string) => {
     const { data, error } = await supabase
       .from('invitations')
       .select('*')
       .eq('token', token)
       .eq('used_at', null)
       .gt('expires_at', new Date().toISOString())
       .single();
     
     return data;
   };
   ```

3. **OAuth verification**
   ```typescript
   const verifyInvitationOAuth = async (token: string, userEmail: string) => {
     const invitation = await validateInvitation(token);
     
     if (!invitation || invitation.email !== userEmail) {
       throw new Error('Invalid invitation or email mismatch');
     }
     
     // Create user profile with role
     await createUserProfile(invitation);
     
     // Mark invitation as used
     await markInvitationUsed(token);
   };
   ```

## 🔒 Security Best Practices

### 1. Row Level Security (RLS)

All tables have RLS policies:
```sql
-- Example: Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Example: Institution-based isolation
CREATE POLICY "Users can view institution data" ON courses
  FOR SELECT USING (
    institution_id IN (
      SELECT institution_id FROM user_institutions 
      WHERE user_id = auth.uid()
    )
  );
```

### 2. JWT Token Security

- Tokens expire automatically
- Refresh tokens are rotated
- Secure cookie storage
- HTTPS enforcement

### 3. Input Validation

```typescript
import { z } from 'zod';

const userProfileSchema = z.object({
  full_name: z.string().min(1).max(100),
  phone_number: z.string().optional(),
  bio: z.string().max(500).optional(),
});

const validateProfile = (data: unknown) => {
  return userProfileSchema.parse(data);
};
```

## 🧪 Testing Authentication

### 1. Test Users

The system includes test users for development:
- **Student**: `student@test.com` (Alex Johnson)
- **Teacher**: `teacher@test.com` (Dr. Sarah Chen)

### 2. Test Login Flow

```typescript
// In LoginPage.tsx
const handleTestLogin = (role: 'student' | 'teacher') => {
  setTestUser(role);
  navigate('/dashboard');
};
```

### 3. OAuth Testing

For OAuth testing in development:
1. Use test OAuth apps
2. Set redirect URLs to localhost
3. Use test user accounts
4. Monitor network requests

## 🚀 Production Deployment

### 1. Environment Variables

```env
# Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_OPENAI_API_KEY=your_production_openai_key

# OAuth Redirect URLs
VITE_OAUTH_REDIRECT_URL=https://yourdomain.com/auth/callback
```

### 2. OAuth App Configuration

Update OAuth apps with production URLs:
```
https://yourdomain.com/auth/callback
https://your-project.supabase.co/auth/v1/callback
```

### 3. Security Headers

Add security headers in your hosting platform:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

## 🔍 Troubleshooting

### Common Issues

1. **OAuth Redirect Error**
   - Check redirect URLs in OAuth apps
   - Verify Supabase site URL
   - Check browser console for errors

2. **CORS Issues**
   - Verify Supabase CORS settings
   - Check allowed origins
   - Ensure HTTPS in production

3. **Token Expiration**
   - Check token refresh logic
   - Verify session persistence
   - Monitor auth state changes

### Debug Mode

Enable debug logging:
```typescript
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
});
```

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [React Router Documentation](https://reactrouter.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🆘 Support

For authentication issues:
1. Check Supabase logs
2. Verify OAuth app configuration
3. Test with minimal setup
4. Contact development team

---

**Remember**: Always test authentication flows thoroughly before deploying to production! 