# TeachMe.ai - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema](#database-schema)
4. [Component Structure](#component-structure)
5. [Authentication & Authorization](#authentication--authorization)
6. [LLM API Integration Guide](#llm-api-integration-guide)
7. [API Endpoints](#api-endpoints)
8. [State Management](#state-management)
9. [Responsive Design](#responsive-design)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Guide](#deployment-guide)
12. [Troubleshooting](#troubleshooting)
13. [Future Roadmap](#future-roadmap)

---

## Project Overview

**TeachMe.ai** is a comprehensive learning management system (LMS) that combines traditional course management with AI-powered tutoring capabilities. The platform serves both students and teachers, providing personalized learning experiences through intelligent course recommendations, progress tracking, and AI-assisted learning support.

### Key Features
- **Student Dashboard**: Course enrollment, progress tracking, assignments, AI tutor chat
- **Teacher Dashboard**: Course creation, student management, assignment creation, progress monitoring
- **AI Tutor Integration**: Context-aware learning assistance and course-specific guidance
- **Responsive Design**: Mobile-first approach with cross-device compatibility
- **Real-time Updates**: Live progress tracking and instant notifications

---

## Architecture & Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Routing**: React Router v6
- **Icons**: Lucide React

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for file uploads

### Development Tools
- **Package Manager**: npm/bun
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Version Control**: Git

---

## Database Schema

### Core Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
  institution_id INTEGER REFERENCES institutions(id),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `courses`
```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT DEFAULT 'en',
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  institution_id INTEGER REFERENCES institutions(id),
  created_by UUID REFERENCES users(id)
);
```

#### `chapters`
```sql
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `content_items`
```sql
CREATE TABLE content_items (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('video', 'reading', 'quiz', 'assignment')),
  duration_estimate_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `enrollments`
```sql
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);
```

#### `assignments`
```sql
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  max_points INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `submissions`
```sql
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  grade INTEGER,
  feedback TEXT
);
```

### Row Level Security (RLS) Policies

```sql
-- Users can only view their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can view courses in their institution
CREATE POLICY "Users can view courses in their institution" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_institutions ui 
      WHERE ui.user_id = auth.uid() 
      AND ui.institution_id = courses.institution_id
    )
  );

-- Users can only view their own enrollments
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Component Structure

### Layout Components
```
src/components/Layout/
├── Header.tsx          # Top navigation with user menu
├── Sidebar.tsx         # Left navigation sidebar
└── index.ts            # Layout exports
```

### Dashboard Components
```
src/components/Dashboard/
├── StudentDashboard.tsx    # Student main dashboard
├── TeacherDashboard.tsx    # Teacher main dashboard
├── CourseView.tsx          # Student course detail view
├── TeacherCourseView.tsx   # Teacher course detail view
└── index.ts                # Dashboard exports
```

### Chat Components
```
src/components/Chat/
├── ChatInterface.tsx       # Main chat component
├── MessageBubble.tsx       # Individual message display
├── TypingIndicator.tsx     # Loading animation
└── index.ts                # Chat exports
```

### UI Components
```
src/components/ui/           # shadcn/ui components
├── button.tsx
├── card.tsx
├── input.tsx
├── tabs.tsx
└── ... (other UI components)
```

---

## Authentication & Authorization

### User Roles
- **Student**: Can enroll in courses, submit assignments, use AI tutor
- **Teacher**: Can create courses, manage students, grade assignments
- **Admin**: Full system access and user management

### Authentication Flow
1. User signs in via Supabase Auth
2. JWT token stored in localStorage
3. User profile fetched and stored in context
4. Route protection based on user role
5. RLS policies enforce data access restrictions

### Protected Routes
```typescript
// Example route protection
const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { profile, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!profile) return <Navigate to="/login" />;
  if (requiredRole && profile.role !== requiredRole) return <AccessDenied />;
  
  return children;
};
```

---

## LLM API Integration Guide

### Overview
The AI tutor functionality integrates with external LLM APIs to provide intelligent, context-aware learning assistance. This section provides a complete implementation guide.

### 1. Provider Selection

#### Recommended Providers
- **OpenAI GPT-4**: Best overall performance, excellent for education
- **Anthropic Claude**: Superior reasoning, great for complex topics
- **Google Gemini**: Competitive pricing, good performance
- **Azure OpenAI**: Enterprise-friendly, Microsoft ecosystem

#### Cost Comparison (as of 2024)
- OpenAI GPT-4: $0.03/1K input tokens, $0.06/1K output tokens
- Claude 3 Sonnet: $0.003/1K input tokens, $0.015/1K output tokens
- Gemini Pro: $0.0005/1K input tokens, $0.0015/1K output tokens

### 2. Environment Setup

#### Environment Variables
```env
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_MODEL=gpt-4-turbo-preview
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# Anthropic Configuration
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_ANTHROPIC_MODEL=claude-3-sonnet-20240229

# Rate Limiting
VITE_MAX_REQUESTS_PER_MINUTE=60
VITE_MAX_TOKENS_PER_REQUEST=1000
```

#### API Key Security
```typescript
// Never expose API keys in frontend code
// Use environment variables and backend proxy for production
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
if (!API_KEY) {
  throw new Error('OpenAI API key not configured');
}
```

### 3. Service Implementation

#### AI Service Class
```typescript
// src/services/aiService.ts
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  type: 'text' | 'video' | 'slide' | 'quiz';
  metadata?: {
    confidence: number;
    suggestedActions: string[];
    relatedTopics: string[];
  };
}

export class AIService {
  private apiKey: string;
  private model: string;
  private baseURL: string;
  private maxTokens: number;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4-turbo-preview';
    this.baseURL = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.maxTokens = parseInt(import.meta.env.VITE_MAX_TOKENS_PER_REQUEST || '1000');
  }

  async generateResponse(
    messages: ChatMessage[], 
    courseContext?: CourseContext,
    userPreferences?: UserPreferences
  ): Promise<AIResponse> {
    try {
      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(courseContext, userPreferences);
      
      // Prepare API request
      const requestBody = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stream: false
      };

      // Make API call
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process and enhance response
      return this.processResponse(data.choices[0].message.content, courseContext);
    } catch (error) {
      console.error('AI API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private buildSystemPrompt(courseContext?: CourseContext, userPreferences?: UserPreferences): string {
    let prompt = `You are an expert AI tutor specializing in personalized learning. `;
    
    if (courseContext) {
      prompt += `Current course: ${courseContext.title}. `;
      prompt += `Topics covered: ${courseContext.topics.join(', ')}. `;
      prompt += `Student level: ${courseContext.studentLevel}. `;
    }
    
    if (userPreferences) {
      prompt += `Student prefers: ${userPreferences.learningStyle}. `;
      prompt += `Difficulty level: ${userPreferences.difficulty}. `;
    }
    
    prompt += `Provide clear, engaging explanations. Use examples when helpful. `;
    prompt += `Ask follow-up questions to ensure understanding. `;
    prompt += `Format responses clearly with proper structure.`;
    
    return prompt;
  }

  private processResponse(content: string, courseContext?: CourseContext): AIResponse {
    // Detect response type
    const type = this.detectResponseType(content);
    
    // Extract metadata
    const metadata = this.extractMetadata(content);
    
    return {
      content,
      type,
      metadata
    };
  }

  private detectResponseType(content: string): 'text' | 'video' | 'slide' | 'quiz' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('video') || lowerContent.includes('watch') || lowerContent.includes('youtube')) {
      return 'video';
    }
    if (lowerContent.includes('slide') || lowerContent.includes('presentation') || lowerContent.includes('diagram')) {
      return 'slide';
    }
    if (lowerContent.includes('quiz') || lowerContent.includes('test') || lowerContent.includes('question')) {
      return 'quiz';
    }
    
    return 'text';
  }

  private extractMetadata(content: string) {
    // Extract confidence indicators, suggested actions, etc.
    const confidence = this.extractConfidence(content);
    const suggestedActions = this.extractSuggestedActions(content);
    const relatedTopics = this.extractRelatedTopics(content);
    
    return {
      confidence,
      suggestedActions,
      relatedTopics
    };
  }
}
```

#### Course Context Interface
```typescript
// src/types/course.ts
export interface CourseContext {
  id: string;
  title: string;
  description: string;
  topics: string[];
  studentLevel: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  learningObjectives: string[];
  currentChapter?: {
    id: string;
    title: string;
    content: string;
  };
}

export interface UserPreferences {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage: string;
  accessibilityNeeds: string[];
}
```

### 4. Chat Interface Integration

#### Updated ChatInterface Component
```typescript
// src/components/Chat/ChatInterface.tsx
import React, { useState, useCallback, useRef } from 'react';
import { AIService } from '@/services/aiService';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ courseId }) => {
  const [messages, setMessages] = useState<Message[]>([...]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const aiService = useRef(new AIService());
  const { courses } = useCourses();
  const { profile } = useAuth();
  
  // Get course context for AI
  const courseContext = courseId ? courses.find(c => c.id.toString() === courseId) : undefined;
  
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setIsError(false);

    try {
      // Prepare conversation history for AI
      const conversationHistory = messages
        .slice(-10) // Last 10 messages for context
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Get user preferences
      const userPreferences = {
        learningStyle: profile?.learningStyle || 'visual',
        difficulty: profile?.difficulty || 'intermediate',
        preferredLanguage: profile?.preferredLanguage || 'en'
      };

      // Call AI service
      const aiResponse = await aiService.current.generateResponse(
        conversationHistory,
        courseContext,
        userPreferences
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        role: 'assistant',
        timestamp: new Date(),
        type: aiResponse.type
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Store conversation in database (optional)
      await storeConversation(userMessage, aiMessage, courseId);
      
    } catch (error) {
      console.error('Chat error:', error);
      setIsError(true);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, messages, courseId, profile, courses]);

  // ... rest of component
};
```

### 5. Advanced Features

#### Streaming Responses
```typescript
// For real-time typing effect
const streamResponse = async (response: Response) => {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let partialResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices?.[0]?.delta?.content) {
            partialResponse += parsed.choices[0].delta.content;
            
            // Update message in real-time
            setMessages(prev => prev.map(msg => 
              msg.id === currentMessageId 
                ? { ...msg, content: partialResponse }
                : msg
            ));
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }
  }
};
```

#### Response Caching
```typescript
class ResponseCache {
  private cache = new Map<string, AIResponse>();
  private ttl = 1000 * 60 * 60; // 1 hour

  set(key: string, response: AIResponse) {
    this.cache.set(key, {
      ...response,
      timestamp: Date.now()
    });
  }

  get(key: string): AIResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }

  generateKey(messages: ChatMessage[], courseContext?: CourseContext): string {
    const messageContent = messages.map(m => m.content).join('|');
    const contextHash = courseContext ? JSON.stringify(courseContext) : '';
    return btoa(messageContent + contextHash).slice(0, 32);
  }
}
```

### 6. Error Handling & Fallbacks

```typescript
class AIErrorHandler {
  static handleError(error: any, fallbackMessages: string[]): string {
    if (error.status === 429) {
      return "I'm getting too many requests right now. Please wait a moment and try again.";
    }
    
    if (error.status === 401) {
      return "Authentication failed. Please check your API key configuration.";
    }
    
    if (error.status === 500) {
      return "The AI service is experiencing issues. Please try again later.";
    }
    
    // Return random fallback message
    const randomIndex = Math.floor(Math.random() * fallbackMessages.length);
    return fallbackMessages[randomIndex];
  }
}

const fallbackMessages = [
  "I'm here to help! What would you like to learn about?",
  "That's an interesting question. Let me think about how to explain this...",
  "I'd be happy to help you with that. Could you provide more details?",
  "Great question! This is a topic that many students find challenging."
];
```

### 7. Cost Optimization

#### Token Management
```typescript
class TokenManager {
  private dailyUsage = 0;
  private dailyLimit = 100000; // 100k tokens per day
  
  canMakeRequest(estimatedTokens: number): boolean {
    return this.dailyUsage + estimatedTokens <= this.dailyLimit;
  }
  
  recordUsage(tokens: number) {
    this.dailyUsage += tokens;
  }
  
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
```

#### Response Optimization
```typescript
const optimizePrompt = (messages: ChatMessage[], maxTokens: number = 1000) => {
  let totalTokens = 0;
  const optimizedMessages = [];
  
  // Start from most recent messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const estimatedTokens = message.content.length / 4;
    
    if (totalTokens + estimatedTokens <= maxTokens) {
      optimizedMessages.unshift(message);
      totalTokens += estimatedTokens;
    } else {
      break;
    }
  }
  
  return optimizedMessages;
};
```

### 8. Testing & Validation

#### Unit Tests
```typescript
// src/services/__tests__/aiService.test.ts
import { AIService } from '../aiService';

describe('AIService', () => {
  let aiService: AIService;
  
  beforeEach(() => {
    aiService = new AIService();
  });
  
  test('should generate response with valid input', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const response = await aiService.generateResponse(messages);
    
    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('type');
    expect(typeof response.content).toBe('string');
  });
  
  test('should handle API errors gracefully', async () => {
    // Mock failed API call
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('API Error'));
    
    await expect(aiService.generateResponse([])).rejects.toThrow('Failed to generate AI response');
  });
});
```

#### Integration Tests
```typescript
// src/components/__tests__/ChatInterface.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInterface from '../ChatInterface';

describe('ChatInterface', () => {
  test('should send message and receive AI response', async () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText('Ask me anything about your courses...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    
    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByText(/Thanks for your message/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
```

---

## API Endpoints

### Authentication Endpoints
```typescript
// Supabase Auth endpoints (handled automatically)
POST /auth/v1/signup
POST /auth/v1/signin
POST /auth/v1/signout
POST /auth/v1/reset-password
```

### Course Management
```typescript
GET /rest/v1/courses          # List courses
POST /rest/v1/courses         # Create course
PUT /rest/v1/courses/:id      # Update course
DELETE /rest/v1/courses/:id   # Delete course
```

### User Management
```typescript
GET /rest/v1/users            # List users
GET /rest/v1/users/:id        # Get user profile
PUT /rest/v1/users/:id        # Update user profile
```

---

## State Management

### Context Providers
```typescript
// src/contexts/AuthContext.tsx
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ... context implementation
};
```

### Custom Hooks
```typescript
// src/hooks/useAuth.tsx
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// src/hooks/useCourses.tsx
export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ... hook implementation
};
```

---

## Responsive Design

### Breakpoint Strategy
```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Mobile-First Approach
```typescript
// Example responsive component
const ResponsiveCard = () => (
  <div className="
    p-4 sm:p-6 lg:p-8
    text-sm sm:text-base lg:text-lg
    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
    gap-4 sm:gap-6 lg:gap-8
  ">
    {/* Content */}
  </div>
);
```

### Touch-Friendly Design
```typescript
// Minimum touch target size: 44px
const TouchButton = () => (
  <button className="
    min-h-[44px] min-w-[44px]
    p-3 sm:p-4
    text-sm sm:text-base
  ">
    Click me
  </button>
);
```

---

## Testing Strategy

### Testing Pyramid
1. **Unit Tests** (70%): Individual components and functions
2. **Integration Tests** (20%): Component interactions
3. **E2E Tests** (10%): Full user workflows

### Testing Tools
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Cypress**: E2E testing
- **MSW**: API mocking

### Test Coverage Goals
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

---

## Deployment Guide

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Build Process
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build
npm run preview
```

### Deployment Platforms
- **Vercel**: Recommended for React apps
- **Netlify**: Good for static sites
- **AWS S3 + CloudFront**: Enterprise solution
- **GitHub Pages**: Free hosting option

---

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection
npm run test:db
```

#### Build Errors
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

#### Runtime Errors
```typescript
// Add error boundaries
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }
}
```

---

## Future Roadmap

### Phase 1: Core Features (Current)
- ✅ User authentication and authorization
- ✅ Course management system
- ✅ Basic AI tutor integration
- ✅ Responsive design

### Phase 2: Enhanced AI (Next 3 months)
- 🔄 Advanced LLM integration
- 🔄 Course-specific AI tutoring
- 🔄 Progress analytics
- 🔄 Adaptive learning paths

### Phase 3: Advanced Features (6 months)
- 📋 Real-time collaboration
- 📋 Video conferencing
- 📋 Advanced assessments
- 📋 Mobile app development

### Phase 4: Enterprise Features (12 months)
- 🏢 Multi-tenant support
- 🏢 Advanced analytics dashboard
- 🏢 API marketplace
- 🏢 White-label solutions

---

## Support & Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Community
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Community](https://discord.gg/your-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/teachme-ai)

### Contact
- **Email**: support@teachme.ai
- **Technical Lead**: tech@teachme.ai
- **General Inquiries**: hello@teachme.ai

---

*Last updated: December 2024*
*Version: 1.0.0*
