# Complete Project Setup Guide for TeachMe.ai

This guide provides step-by-step instructions for setting up the entire TeachMe.ai project from scratch, including development environment, database, authentication, and deployment.

## 🎯 Project Overview

TeachMe.ai is a GenAI-based education platform with:
- **Multitenant Architecture**: Support for multiple schools/institutions
- **Role-based Access**: Admin, Teacher, Student, Parent roles
- **AI Integration**: GPT-powered tutoring and assessment
- **Modern Tech Stack**: React, TypeScript, Supabase, TailwindCSS

## 🛠️ Prerequisites

### Required Software
- **Node.js**: Version 18+ ([Download](https://nodejs.org/))
- **Git**: Version control ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))
- **Browser**: Chrome/Firefox with developer tools

### Required Accounts
- **Supabase**: Database and authentication ([Sign up](https://supabase.com/))
- **GitHub**: Code repository ([Sign up](https://github.com/))
- **Google Cloud**: OAuth credentials (optional)
- **Facebook Developers**: OAuth credentials (optional)
- **LinkedIn Developers**: OAuth credentials (optional)

## 🚀 Step-by-Step Setup

### Phase 1: Project Initialization

#### 1.1 Clone Repository
```bash
# Clone the project
git clone <your-repository-url>
cd learn-genie-80

# Install dependencies
npm install
# or
yarn install
# or
bun install
```

#### 1.2 Environment Configuration
Create `.env.local` file in the root directory:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key

# Development Configuration
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
```

#### 1.3 Verify Installation
```bash
# Check if everything is working
npm run dev

# Open http://localhost:5173 in your browser
# You should see the login page
```

### Phase 2: Supabase Setup

#### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Fill in project details:
   - **Name**: `teachme-ai`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to you
4. Click **Create new project**
5. Wait for setup completion (2-3 minutes)

#### 2.2 Get Project Credentials
1. In Supabase dashboard, go to **Settings** > **API**
2. Copy your credentials:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 2.3 Update Environment Variables
Update `.env.local` with your actual Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
```

### Phase 3: Database Setup

#### 3.1 Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Create new query
3. Copy and paste contents of `supabase/schema.sql`
4. Click **Run** to execute

**Expected Result**: 25+ tables created with proper relationships

#### 3.2 Insert Sample Data
1. In **SQL Editor**, create new query
2. Copy and paste contents of `supabase/seed.sql`
3. Click **Run** to populate with sample data

**Expected Result**: Sample institutions, users, courses, and content

#### 3.3 Verify Database Setup
```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Check sample data
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as course_count FROM courses;
```

### Phase 4: Authentication Setup

#### 4.1 Configure Supabase Auth
1. In Supabase dashboard, go to **Authentication** > **Settings**
2. Set **Site URL**: `http://localhost:5173` (for development)
3. Add redirect URLs:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:3000/auth/callback`

#### 4.2 OAuth Provider Setup (Optional)

**Google OAuth**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback`
6. Copy Client ID and Secret to Supabase

**Facebook OAuth**:
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Copy App ID and Secret to Supabase

**LinkedIn OAuth**:
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers)
2. Create new app
3. Configure OAuth 2.0 settings
4. Add redirect URIs
5. Copy Client ID and Secret to Supabase

#### 4.3 Test Authentication
1. Restart your development server
2. Go to `http://localhost:5173`
3. Test login buttons:
   - **Test Student**: Should show student dashboard
   - **Test Teacher**: Should show teacher dashboard

### Phase 5: Development Environment

#### 5.1 Code Structure
```
src/
├── components/          # React components
│   ├── auth/           # Authentication
│   ├── Dashboard/      # Role-based dashboards
│   ├── Layout/         # Header, Sidebar
│   └── ui/             # Reusable UI components
├── hooks/               # Custom React hooks
├── integrations/        # External services
├── lib/                 # Utilities
├── pages/               # Page components
└── types/               # TypeScript definitions
```

#### 5.2 Key Components
- **LoginPage**: Authentication interface with test buttons
- **StudentDashboard**: Student-specific dashboard
- **TeacherDashboard**: Teacher-specific dashboard
- **UserProfile**: User profile management
- **Sidebar**: Role-based navigation
- **Header**: Top navigation with sidebar toggle

#### 5.3 Development Workflow
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Phase 6: Testing and Validation

#### 6.1 Test User Flows
1. **Student Flow**:
   - Click "Test Student" button
   - Verify student dashboard loads
   - Check course overview and progress
   - Test AI tutor chat

2. **Teacher Flow**:
   - Click "Test Teacher" button
   - Verify teacher dashboard loads
   - Check course management tabs
   - Test student overview

3. **Navigation Flow**:
   - Test sidebar open/close
   - Verify role-based navigation
   - Check profile access

#### 6.2 Database Validation
```sql
-- Test user isolation
SELECT * FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- Test course access
SELECT c.title, up.status 
FROM courses c 
JOIN user_progress up ON c.id = up.course_id 
WHERE up.user_id = '550e8400-e29b-41d4-a716-446655440001';
```

#### 6.3 Component Testing
- Verify all UI components render correctly
- Check responsive design on different screen sizes
- Test form submissions and validations
- Verify error handling and loading states

### Phase 7: Production Preparation

#### 7.1 Environment Variables
Create `.env.production`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_OPENAI_API_KEY=your_production_openai_key
VITE_APP_ENV=production
VITE_APP_URL=https://yourdomain.com
```

#### 7.2 Build Configuration
```bash
# Production build
npm run build

# Check build output
ls -la dist/

# Test production build locally
npm run preview
```

#### 7.3 Deployment Options

**Vercel**:
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

**Netlify**:
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variables

**AWS S3 + CloudFront**:
1. Upload `dist/` contents to S3 bucket
2. Configure CloudFront distribution
3. Set custom domain

## 🔧 Configuration Files

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 🧪 Testing Strategy

### Unit Testing
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm test
```

### Integration Testing
- Test authentication flows
- Verify database operations
- Check API integrations
- Test role-based access

### End-to-End Testing
- Complete user journeys
- Cross-browser compatibility
- Performance testing
- Security validation

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files
- Use different keys for dev/prod
- Rotate keys regularly
- Monitor key usage

### Database Security
- Row Level Security enabled
- Proper user isolation
- Input validation
- SQL injection prevention

### Authentication Security
- Secure OAuth flows
- JWT token management
- Session handling
- Rate limiting

## 📊 Monitoring and Analytics

### Application Monitoring
- Error tracking (Sentry)
- Performance monitoring
- User analytics
- Database performance

### Supabase Monitoring
- Database logs
- Authentication logs
- API usage
- Storage usage

## 🚀 Performance Optimization

### Frontend Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis

### Database Optimization
- Query optimization
- Index management
- Connection pooling
- Caching strategies

## 🔄 Continuous Integration

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

### Automated Testing
- Run tests on every commit
- Build verification
- Security scanning
- Performance testing

## 🆘 Troubleshooting

### Common Issues

1. **Build Errors**:
   ```bash
   # Clear dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Database Connection**:
   - Verify Supabase credentials
   - Check network connectivity
   - Verify RLS policies

3. **Authentication Issues**:
   - Check OAuth configuration
   - Verify redirect URLs
   - Check browser console errors

4. **TypeScript Errors**:
   ```bash
   # Check types
   npm run type-check
   
   # Fix common issues
   npm run lint -- --fix
   ```

### Debug Mode
```typescript
// Enable debug logging
const supabase = createClient(url, key, {
  auth: { debug: true }
});

// Check browser console for detailed logs
```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)

## 🆘 Support

For technical support:
1. Check documentation
2. Review GitHub issues
3. Create detailed bug report
4. Contact development team

---

**Remember**: This is a production-ready setup. Always test thoroughly before deploying! 