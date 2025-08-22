import React, { useState } from 'react';
import { BookOpen, Clock, CheckCircle, FileText, ChevronRight, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompletedCourses } from '@/hooks/useCompletedCourses';

interface CourseDetailViewProps {
  courseId: number;
}

const CourseDetailView: React.FC<CourseDetailViewProps> = ({ courseId }) => {
  const { getCourseById } = useCompletedCourses();
  const course = getCourseById(courseId);
  const [activeTab, setActiveTab] = useState('syllabus');

  if (!course) {
    return (
      <div className="space-y-6">
        <div className="text-center text-muted-foreground">
          <p>Course not found</p>
        </div>
      </div>
    );
  }

  // Mock chapters data - in a real app, this would come from the database
  const chapters = [
    {
      id: 1,
      title: 'Introduction to Machine Learning',
      description: 'Overview of machine learning concepts, types, and applications',
      position: 1,
      estimated_duration_minutes: 120,
      is_required: true
    },
    {
      id: 2,
      title: 'Supervised Learning',
      description: 'Understanding classification and regression algorithms',
      position: 2,
      estimated_duration_minutes: 180,
      is_required: true
    },
    {
      id: 3,
      title: 'Unsupervised Learning',
      description: 'Clustering, dimensionality reduction, and association rules',
      position: 3,
      estimated_duration_minutes: 150,
      is_required: true
    },
    {
      id: 4,
      title: 'Neural Networks and Deep Learning',
      description: 'Building and training neural networks for complex problems',
      position: 4,
      estimated_duration_minutes: 240,
      is_required: true
    }
  ];

  const handleRetake = () => {
    // In a real app, this would reset the course progress and re-enroll the user
    console.log('Retaking course:', course.title);
    // You could implement logic to:
    // 1. Reset user progress for this course
    // 2. Change enrollment status back to 'in_progress'
    // 3. Navigate to the course content
  };

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
            <p className="text-muted-foreground max-w-2xl mt-2">
              {course.description}
            </p>
            <div className="flex items-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{chapters.length} Chapters</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">100% Complete</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">EN</span>
              </div>
            </div>
          </div>
        </div>
        <Button 
          onClick={handleRetake}
          variant="outline" 
          size="sm"
          className="flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retake</span>
        </Button>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="tutor">Tutor</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Course Syllabus</h2>
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <Card key={chapter.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                          {chapter.position}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{chapter.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {chapter.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tutor" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Course Tutor</h2>
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <p>Tutor information and support will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Course Assessment</h2>
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <p>Assessment results and certificates will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Course Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{course.grade}</p>
                <p className="text-sm text-muted-foreground">Final Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{course.estimated_duration_hours}h</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{course.completed_content_items}</p>
                <p className="text-sm text-muted-foreground">Items Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Tags */}
      {course.tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Course Tags</h3>
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Completion Certificate */}
      {course.completion_certificate_url && (
        <Card>
          <CardHeader>
            <CardTitle>Completion Certificate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                You can download your completion certificate
              </p>
              <Button variant="outline" size="sm">
                Download Certificate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseDetailView;
