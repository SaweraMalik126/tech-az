import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  FileText,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  MessageCircle,
  Calendar,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Star,
  Mail,
  GraduationCap,
  Target,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useCourses, Course } from "@/hooks/useCourses";
import { useAssignments } from "@/hooks/useAssignments";
import { useStudents, Student } from "@/hooks/useStudents";
import ChatInterface from "@/components/Chat/ChatInterface";
import StudentsList from "./StudentsList";
import FeedbackPage from "./FeedbackPage";
import SupportPage from "./SupportPage";
import SettingsPage from "./SettingsPage";

interface TeacherDashboardProps {
  activeTab?: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  activeTab: initialTab = "overview",
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showInviteStudent, setShowInviteStudent] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const { profile } = useAuth();
  const {
    courses,
    loading: coursesLoading,
    createCourse,
    updateCourse,
    deleteCourse,
  } = useCourses();
  const {
    assignments,
    submissions,
    loading: assignmentsLoading,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    gradeSubmission,
  } = useAssignments(selectedCourse || undefined);
  const {
    students,
    loading: studentsLoading,
    inviteStudent,
    removeStudent,
  } = useStudents(selectedCourse || undefined);

  // Update activeTab when prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Calculate dashboard statistics
  const totalCourses = courses.length;
  const totalStudents = students.length;
  const activeAssignments = assignments.filter(
    (a) => a.status === "active"
  ).length;
  const averageProgress =
    courses.length > 0
      ? Math.round(
          courses.reduce((sum, c) => sum + (c.progress || 0), 0) /
            courses.length
        )
      : 0;
  const pendingGradings = submissions.filter((s) => s.grade === null).length;
  const averageClassScore =
    assignments.length > 0
      ? Math.round(
          assignments.reduce((sum, a) => sum + (a.average_score || 0), 0) /
            assignments.length
        )
      : 0;

  // Course creation form state
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    language: "en",
  });

  // Assignment creation form state
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    instructions: "",
    due_date: "",
    max_points: 100,
  });

  const handleCreateCourse = async () => {
    try {
      if (!profile) return;

      await createCourse({
        title: newCourse.title,
        description: newCourse.description,
        language: newCourse.language,
        institution_id: parseInt(profile.institution_id || "1"),
        created_by: profile.id,
        status: "draft",
      });

      setNewCourse({ title: "", description: "", language: "en" });
      setShowCreateCourse(false);
    } catch (error) {
      console.error("Error creating course:", error);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      if (!selectedCourse) return;

      await createAssignment({
        title: newAssignment.title,
        instructions: newAssignment.instructions,
        due_date: newAssignment.due_date || null,
        max_points: newAssignment.max_points,
        course_id: selectedCourse,
      });

      setNewAssignment({
        title: "",
        instructions: "",
        due_date: "",
        max_points: 100,
      });
      setShowCreateAssignment(false);
    } catch (error) {
      console.error("Error creating assignment:", error);
    }
  };

  const handleInviteStudent = async () => {
    try {
      if (!selectedCourse) return;

      await inviteStudent(inviteEmail);
      setInviteEmail("");
      setShowInviteStudent(false);
    } catch (error) {
      console.error("Error inviting student:", error);
    }
  };

  const handleGradeSubmission = async (
    submissionId: number,
    grade: number,
    feedback: string
  ) => {
    try {
      await gradeSubmission(submissionId, grade, feedback);
    } catch (error) {
      console.error("Error grading submission:", error);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      await removeStudent(studentId);
    } catch (error) {
      console.error("Error removing student:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Teacher Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back, {profile?.full_name}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button onClick={() => setShowCreateCourse(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {courses.filter((c) => c.status === "published").length} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Active Assignments
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{activeAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {pendingGradings} pending grades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Average Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{averageProgress}%</div>
            <p className="text-xs text-muted-foreground">Class average</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 sm:gap-2 overflow-x-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap">Overview</TabsTrigger>
          <TabsTrigger value="courses" className="text-xs sm:text-sm whitespace-nowrap">My Courses</TabsTrigger>
          <TabsTrigger value="students" className="text-xs sm:text-sm whitespace-nowrap">Students</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs sm:text-sm whitespace-nowrap">Assignments</TabsTrigger>
          <TabsTrigger value="ai-assistant" className="text-xs sm:text-sm whitespace-nowrap">AI Assistant</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm whitespace-nowrap">Settings</TabsTrigger>
          <TabsTrigger value="support" className="text-xs sm:text-sm whitespace-nowrap">Support</TabsTrigger>
          <TabsTrigger value="feedback" className="text-xs sm:text-sm whitespace-nowrap">Feedback</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {submissions.slice(0, 5).map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">
                        {submission.student?.full_name || "Unknown Student"}{" "}
                        submitted assignment
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    {submission.grade === null && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">Needs Grading</Badge>
                    )}
                  </div>
                ))}
                {submissions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowCreateCourse(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Course
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowCreateAssignment(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowInviteStudent(true)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Invite Students
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-bold">My Courses</h2>
            <Button onClick={() => setShowCreateCourse(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Course
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {coursesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : courses.length > 0 ? (
              courses.map((course) => (
                <Card key={course.id} className="course-card">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <CardTitle className="text-base sm:text-lg line-clamp-2">{course.title}</CardTitle>
                      <Badge
                        variant={
                          course.status === "published"
                            ? "default"
                            : "secondary"
                        }
                        className="w-fit"
                      >
                        {course.status}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {course.description || "No description available"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span>Progress</span>
                      <span>{course.progress || 0}%</span>
                    </div>
                    <Progress value={course.progress || 0} className="w-full" />

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span>Chapters</span>
                      <span>{course.chapters?.length || 0}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedCourse(course.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCourse(course.id);
                          setActiveTab("students");
                        }}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Students
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8 sm:py-12">
                <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">No courses yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first course to get started
                </p>
                <Button onClick={() => setShowCreateCourse(true)} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <StudentsList />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-bold">Assignments</h2>
            {selectedCourse && (
              <Button onClick={() => setShowCreateAssignment(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Assignment
              </Button>
            )}
          </div>

          {!selectedCourse ? (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Select a Course</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a course from the Courses tab to view and manage
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
                assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base mb-2">{assignment.title}</h4>
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
                            <span>
                              Submissions: {assignment.submission_count}
                            </span>
                            <span>Graded: {assignment.graded_count}</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => deleteAssignment(assignment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8 sm:py-12">
                    <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">
                      No assignments yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create assignments to help students learn and assess their
                      progress
                    </p>
                    <Button onClick={() => setShowCreateAssignment(true)} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Assignment
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai-assistant" className="space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold">AI Teaching Assistant</h2>
          </div>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">
                  AI-Powered Teaching Support
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get help with lesson planning, student assessment, and
                  personalized learning recommendations
                </p>
              </div>

              <ChatInterface courseId={selectedCourse?.toString()} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <SettingsPage userRole="teacher" />
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <SupportPage userRole="teacher" />
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <FeedbackPage userRole="teacher" />
        </TabsContent>
      </Tabs>

      {/* Create Course Dialog */}
      <Dialog open={showCreateCourse} onOpenChange={setShowCreateCourse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course-title">Course Title</Label>
              <Input
                id="course-title"
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, title: e.target.value })
                }
                placeholder="Enter course title"
              />
            </div>
            <div>
              <Label htmlFor="course-description">Description</Label>
              <Textarea
                id="course-description"
                value={newCourse.description}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, description: e.target.value })
                }
                placeholder="Enter course description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="course-language">Language</Label>
              <Select
                value={newCourse.language}
                onValueChange={(value) =>
                  setNewCourse({ ...newCourse, language: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ur">Urdu</SelectItem>
                  <SelectItem value="pa">Punjabi</SelectItem>
                  <SelectItem value="sd">Sindhi</SelectItem>
                  <SelectItem value="ps">Pashto</SelectItem>
                  <SelectItem value="sk">Saraiki</SelectItem>
                  <SelectItem value="ba">Balochi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateCourse(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCourse} disabled={!newCourse.title}>
                Create Course
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Assignment Dialog */}
      <Dialog
        open={showCreateAssignment}
        onOpenChange={setShowCreateAssignment}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignment-title">Assignment Title</Label>
              <Input
                id="assignment-title"
                value={newAssignment.title}
                onChange={(e) =>
                  setNewAssignment({ ...newAssignment, title: e.target.value })
                }
                placeholder="Enter assignment title"
              />
            </div>
            <div>
              <Label htmlFor="assignment-instructions">Instructions</Label>
              <Textarea
                id="assignment-instructions"
                value={newAssignment.instructions}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    instructions: e.target.value,
                  })
                }
                placeholder="Enter assignment instructions"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignment-due-date">Due Date</Label>
                <Input
                  id="assignment-due-date"
                  type="date"
                  value={newAssignment.due_date}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      due_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="assignment-points">Max Points</Label>
                <Input
                  id="assignment-points"
                  type="number"
                  value={newAssignment.max_points}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      max_points: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  max="1000"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateAssignment(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAssignment}
                disabled={!newAssignment.title}
              >
                Create Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Student Dialog */}
      <Dialog open={showInviteStudent} onOpenChange={setShowInviteStudent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Student to Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-email">Student Email</Label>
              <Input
                id="student-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter student email address"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowInviteStudent(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleInviteStudent} disabled={!inviteEmail}>
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDashboard;
