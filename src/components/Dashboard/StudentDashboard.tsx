import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  Target,
  Calendar,
  FileText,
  Play,
  BarChart3,
  MessageCircle,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useCourses, Course } from "@/hooks/useCourses";
import { useAssignments } from "@/hooks/useAssignments";
import ChatInterface from "@/components/Chat/ChatInterface";

interface StudentDashboardProps {
  activeTab?: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
  activeTab: initialTab = "assignments",
}) => {
  const { profile } = useAuth();
  const { courses, loading: coursesLoading } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // Update activeTab when prop changes
  useEffect(() => {
    if (initialTab && (initialTab === "assignments" || initialTab === "ai-tutor")) {
      setActiveTab(initialTab);
    } else {
      setActiveTab("assignments"); // Default to assignments if invalid tab
    }
  }, [initialTab]);

  const {
    assignments,
    submissions,
    loading: assignmentsLoading,
    submitAssignment,
  } = useAssignments(selectedCourse || undefined);

  // Calculate statistics
  const enrolledCourses = courses.filter(
    (course) => course.progress !== undefined
  );
  const completedCourses = enrolledCourses.filter(
    (course) => (course.progress || 0) >= 100
  );
  const inProgressCourses = enrolledCourses.filter(
    (course) => (course.progress || 0) > 0 && (course.progress || 0) < 100
  );

  const totalHoursLearned = enrolledCourses.reduce((total, course) => {
    const courseHours =
      course.chapters?.reduce((chapterTotal, chapter) => {
        return (
          chapterTotal +
          (chapter.content_items?.reduce((itemTotal, item) => {
            return itemTotal + (item.duration_estimate_seconds || 0) / 3600; // Convert seconds to hours
          }, 0) || 0)
        );
      }, 0) || 0;
    return total + (courseHours * (course.progress || 0)) / 100;
  }, 0);

  const averageCompletionRate =
    enrolledCourses.length > 0
      ? Math.round(
          enrolledCourses.reduce(
            (sum, course) => sum + (course.progress || 0),
            0
          ) / enrolledCourses.length
        )
      : 0;

  const averageRating = 4.5; // This would come from reviews table in real implementation

  const pendingAssignments = assignments.filter((assignment) => {
    const submission = submissions.find(
      (s) => s.assignment_id === assignment.id
    );
    return !submission;
  });

  const completedAssignments = assignments.filter((assignment) => {
    const submission = submissions.find(
      (s) => s.assignment_id === assignment.id
    );
    return submission && submission.grade !== null;
  });

  const handleCourseSelect = (courseId: number) => {
    setSelectedCourse(courseId);
  };

  const handleAssignmentSubmission = async (
    assignmentId: number,
    content: string
  ) => {
    try {
      await submitAssignment(assignmentId, {
        text: content,
        submitted_at: new Date().toISOString(),
      });
      // Refresh assignments
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error("Error submitting assignment:", error);
    }
  };

  if (coursesLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Welcome back, {profile?.full_name || "Student"}!
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Continue your learning journey with personalized AI assistance and
          progress tracking.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Enrolled Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{enrolledCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              {inProgressCourses.length} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Hours Learned</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {totalHoursLearned.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{averageCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Average across courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{averageRating}</div>
            <p className="text-xs text-muted-foreground">
              From {completedCourses.length} courses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4 sm:space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignments" className="text-xs sm:text-sm">Assignments</TabsTrigger>
          <TabsTrigger value="ai-tutor" className="text-xs sm:text-sm">AI Tutor Chat</TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-bold">Assignments</h2>
            {selectedCourse && (
              <Badge variant="outline" className="w-fit">
                Course: {courses.find((c) => c.id === selectedCourse)?.title}
              </Badge>
            )}
          </div>

          {!selectedCourse ? (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Select a Course</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a course from the Course Overview tab to view
                  assignments
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {assignmentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 sm:h-20 bg-muted rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : assignments.length > 0 ? (
                assignments.map((assignment) => {
                  const submission = submissions.find(
                    (s) => s.assignment_id === assignment.id
                  );
                  const isSubmitted = !!submission;
                  const isGraded = submission && submission.grade !== null;

                  return (
                    <Card key={assignment.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                              <h4 className="font-semibold text-sm sm:text-base truncate">
                                {assignment.title}
                              </h4>
                              {isSubmitted && (
                                <Badge
                                  variant={isGraded ? "default" : "secondary"}
                                  className="w-fit"
                                >
                                  {isGraded ? "Graded" : "Submitted"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                              {assignment.instructions ||
                                "No instructions provided"}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-muted-foreground">
                              <span>
                                Due:{" "}
                                {assignment.due_date
                                  ? new Date(
                                      assignment.due_date
                                    ).toLocaleDateString()
                                  : "No due date"}
                              </span>
                              <span>Max Points: {assignment.max_points}</span>
                              {isGraded && (
                                <span className="text-primary font-medium">
                                  Grade: {submission?.grade}/
                                  {assignment.max_points}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {!isSubmitted ? (
                              <Button
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                  // Simple text submission for now
                                  const content = prompt(
                                    "Enter your assignment submission:"
                                  );
                                  if (content) {
                                    handleAssignmentSubmission(
                                      assignment.id,
                                      content
                                    );
                                  }
                                }}
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Submit
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled className="w-full sm:w-auto">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Submitted
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="text-center py-8 sm:py-12">
                    <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">
                      No assignments yet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your teacher hasn't assigned any work for this course yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* AI Tutor Chat Tab */}
        <TabsContent value="ai-tutor" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-bold">AI Tutor Chat</h2>
            {selectedCourse && (
              <Badge variant="outline" className="w-fit">
                Course: {courses.find((c) => c.id === selectedCourse)?.title}
              </Badge>
            )}
          </div>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">
                  Personalized AI Learning Assistant
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get help with your studies, ask questions, and receive
                  personalized learning recommendations
                </p>
              </div>

              <ChatInterface courseId={selectedCourse?.toString()} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
