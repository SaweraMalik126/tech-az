# 🚀 TeachMe.ai - AI-Powered Education Platform

A comprehensive, multitenant GenAI-based education platform that revolutionizes learning through personalized AI assistance, interactive content, and intelligent assessment systems.

## ✨ Features

### 🎓 Learning Module
- **Course Management**: Create, organize, and deliver structured learning content
- **Interactive Content**: Slides, whiteboarding, videos, infographics, and more
- **AI-Powered Chat**: Personalized learning assistance with voice support
- **Peer Learning**: Collaborative learning experiences
- **Regional Language Support**: Multi-language content delivery
- **Progress Tracking**: Real-time learning analytics and insights

### 📝 Assessment Module
- **Smart Quizzes**: Auto-grading with time limits and multiple attempts
- **Problem-Solving**: Interactive problem-solving exercises
- **Role Reversal**: Students become teachers through "Teach-Back" sessions
- **Self-Check**: Diagnostic assessments for personalized learning
- **Human Review**: Expert review and feedback systems

### 🤖 GenAI Agents
- **Teacher Agent**: Lesson planning, student assessment, and personalized recommendations
- **Student Agent**: Learning assistance, concept explanation, and study guidance
- **Examiner Agent**: Automated grading and feedback generation

## 🏗️ Architecture

### Frontend
- **React.js** with TypeScript for robust development
- **Vite** for fast build and development experience
- **Shadcn UI** components for modern, accessible design
- **TailwindCSS** for responsive styling
- **React Query** for efficient data fetching and caching

### Backend & Database
- **Supabase** for PostgreSQL database and real-time features
- **Row Level Security (RLS)** for data isolation and security
- **Real-time subscriptions** for live updates
- **Authentication** with OAuth providers (Google, Facebook, LinkedIn)

### AI Integration
- **OpenAI GPT** for intelligent content generation and assistance
- **Vector embeddings** for semantic search and memory
- **Voice/Video** infrastructure for multimedia learning

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Teachmeai/Teachme-ai.git
   cd Teachme-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Update `src/integrations/supabase/client.ts`

4. **Set up database**
   - Run the SQL commands in `supabase/schema.sql`
   - Insert sample data from `supabase/sample_data.sql`
   - See `DATABASE_SETUP.md` for detailed instructions

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Test the application**
   - Open `http://localhost:8080` in your browser
   - Use "Test Student" or "Test Teacher" buttons to bypass authentication
   - Explore the dashboard and features

## 📚 Documentation

- **`PROJECT_SETUP.md`** - Complete project setup guide
- **`DATABASE_SETUP.md`** - Database configuration and troubleshooting
- **`AUTHENTICATION_SETUP.md`** - OAuth and authentication setup
- **`setup-database.md`** - Quick database fix for data fetching issues

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── Chat/           # AI chat interface
│   ├── Dashboard/      # Dashboard components
│   ├── Layout/         # Layout and navigation
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/                # Utility functions
└── pages/              # Page components
```

### Key Hooks
- **`useAuth`** - Authentication and user management
- **`useCourses`** - Course data and operations
- **`useAssignments`** - Assignment management
- **`useStudents`** - Student data and progress

### Testing Database Connection
Use `test-database.html` to verify your Supabase setup:
1. Open the file in your browser
2. Click "Run Complete Test Suite"
3. Review the results to identify any issues

## 🌟 Current Phase Features

### Student Dashboard
- View enrolled courses with progress tracking
- Access assignments and submit work
- AI tutor chat for personalized assistance
- Progress analytics and learning insights

### Teacher Dashboard
- Create and manage courses
- Assign and grade student work
- Monitor student progress and performance
- AI-powered teaching assistance

### User Management
- Role-based access control (Student, Teacher, Admin)
- Profile management with social media links
- Notification preferences and settings

## 🔒 Security Features

- **Row Level Security (RLS)** for data isolation
- **OAuth authentication** with major providers
- **JWT token management** for secure sessions
- **Permission-based access control**
- **Audit logging** for compliance

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run preview
```

### Environment Variables
Create `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the setup guides in the `/docs` folder
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions for help and ideas

## 🔮 Roadmap

- [ ] **Phase 2**: Advanced AI features and analytics
- [ ] **Phase 3**: Mobile applications (iOS/Android)
- [ ] **Phase 4**: Enterprise features and integrations
- [ ] **Phase 5**: Advanced assessment and certification systems

---

**Built with ❤️ for the future of education**

*Transform learning with AI-powered intelligence*
""   
