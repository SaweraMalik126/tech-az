import React, { useState } from 'react';
import { MessageCircle, Trophy } from 'lucide-react';
import Header from '@/components/Layout/Header';
import Sidebar from '@/components/Layout/Sidebar';
import ChatInterface from '@/components/Chat/ChatInterface';
import StudentDashboard from '@/components/Dashboard/StudentDashboard';
import TeacherDashboard from '@/components/Dashboard/TeacherDashboard';
import UserProfile from '@/components/Profile/UserProfile';
import CourseView from '@/components/Dashboard/CourseView';
import TeacherCourseView from '@/components/Dashboard/TeacherCourseView';
import CompletedCourses from '@/components/Dashboard/CompletedCourses';
import CourseDetailView from '@/components/Dashboard/CourseDetailView';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Collapse sidebar by default on small screens
  React.useEffect(() => {
    if (window.innerWidth < 640) {
      setSidebarOpen(false);
    }
  }, []);
  const [activeView, setActiveView] = useState('general-chat');
  const { loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <div className="animate-pulse">
          <div className="w-8 h-8 ai-gradient rounded-lg mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} setActiveView={setActiveView} />
      
      <div className="flex">
        <Sidebar 
          open={sidebarOpen}
          activeView={activeView}
          setActiveView={setActiveView}
        />
        
        <main className="flex-1 p-4 sm:p-6 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {activeView === 'general-chat' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-ai-primary text-white rounded-xl">
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">General Chat</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Ask me anything about your studies!</p>
                  </div>
                </div>
                <ChatInterface />
              </div>
            )}
            
            {activeView === 'dashboard' && (
              profile?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />
            )}
            
            {activeView === 'completed-courses' && <CompletedCourses setActiveView={setActiveView} />}
            
            {activeView.startsWith('completed-course-') && (
              <CourseDetailView courseId={parseInt(activeView.replace('completed-course-', ''))} />
            )}
            
            {/* Settings, Support, and Feedback views - show dashboard with appropriate tab */}
            {activeView === 'settings' && (
              profile?.role === 'teacher' ? <TeacherDashboard activeTab="settings" /> : <StudentDashboard activeTab="settings" />
            )}
            
            {activeView === 'support' && (
              profile?.role === 'teacher' ? <TeacherDashboard activeTab="support" /> : <StudentDashboard activeTab="support" />
            )}
            
            {activeView === 'feedback' && (
              profile?.role === 'teacher' ? <TeacherDashboard activeTab="feedback" /> : <StudentDashboard activeTab="feedback" />
            )}
            
            {activeView === 'profile' && <UserProfile />}
            
            {/* Teacher-specific views */}
            {activeView === 'my-courses' && profile?.role === 'teacher' && <TeacherDashboard activeTab="courses" />}
            {activeView === 'students' && profile?.role === 'teacher' && <TeacherDashboard activeTab="students" />}
            {activeView === 'assignments' && profile?.role === 'teacher' && <TeacherDashboard activeTab="assignments" />}
            
            {activeView.startsWith('course-') && (
              profile?.role === 'teacher' ? (
                <TeacherCourseView courseId={activeView.replace('course-', '')} />
              ) : (
                <CourseView courseId={activeView.replace('course-', '')} />
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;