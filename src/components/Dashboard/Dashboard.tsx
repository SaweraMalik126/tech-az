import React from 'react';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp,
  Play,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: "Courses Enrolled",
      value: "3",
      icon: BookOpen,
      change: "+1 this month",
      color: "text-primary"
    },
    {
      title: "Hours Learned",
      value: "47.5",
      icon: Clock,
      change: "+8.2 this week",
      color: "text-success"
    },
    {
      title: "Completion Rate",
      value: "78%",
      icon: TrendingUp,
      change: "+12% improvement",
      color: "text-ai-primary"
    },
    {
      title: "Average Score",
      value: "85%",
      icon: Award,
      change: "+5% from last month",
      color: "text-orange-500"
    }
  ];

  const courses = [
    {
      id: 1,
      title: "Calculus I",
      description: "Fundamental concepts of calculus including limits, derivatives, and integrals",
      progress: 67,
      totalHours: 25,
      completedHours: 16.75,
      thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=200&fit=crop",
      instructor: "Dr. Sarah Johnson",
      nextLesson: "Integration by Parts"
    },
    {
      id: 2,
      title: "Physics: Electricity",
      description: "Explore electric fields, circuits, and electromagnetic phenomena",
      progress: 45,
      totalHours: 30,
      completedHours: 13.5,
      thumbnail: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=300&h=200&fit=crop",
      instructor: "Prof. Michael Chen",
      nextLesson: "Ohm's Law Applications"
    },
    {
      id: 3,
      title: "Organic Chemistry",
      description: "Study of carbon compounds and their reactions",
      progress: 23,
      totalHours: 35,
      completedHours: 8.05,
      thumbnail: "https://images.unsplash.com/photo-1532634726-8121448ccb85?w=300&h=200&fit=crop",
      instructor: "Dr. Emily Rodriguez",
      nextLesson: "Alkene Reactions"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your learning progress and continue your educational journey
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="course-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Your Courses</h2>
          <Button variant="outline">View All Courses</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="course-card overflow-hidden">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button size="sm" className="btn-hero">
                    <Play className="w-4 h-4 mr-2" />
                    Continue Learning
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instructor: {course.instructor}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{course.completedHours}h completed</span>
                    <span>{course.totalHours}h total</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Next Lesson</p>
                    <p className="text-sm font-medium text-foreground">{course.nextLesson}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Stats
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col h-auto p-6 space-y-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">Explore Courses</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-6 space-y-2">
              <Clock className="w-6 h-6 text-success" />
              <span className="text-sm font-medium">Study Schedule</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-6 space-y-2">
              <Award className="w-6 h-6 text-ai-primary" />
              <span className="text-sm font-medium">Achievements</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-6 space-y-2">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              <span className="text-sm font-medium">Progress Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;