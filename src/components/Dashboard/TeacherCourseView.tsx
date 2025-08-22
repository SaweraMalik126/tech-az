import React, { useState } from "react";
import { BookOpen, Users, MessageCircle, ChevronRight, ChevronDown, Play, Clock, CheckCircle, Star, Target, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCourses, Course } from "@/hooks/useCourses";
import { useStudents, Student } from "@/hooks/useStudents";
import ChatInterface from "@/components/Chat/ChatInterface";

interface TeacherCourseViewProps {
  courseId: string;
}

const TeacherCourseView: React.FC<TeacherCourseViewProps> = ({ courseId }) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("syllabus");
  
  const { courses, loading } = useCourses();
  const { students, loading: studentsLoading } = useStudents(parseInt(courseId));
  
  const course = courses.find(c => c.id.toString() === courseId);
  
  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Course not found</h3>
        <p className="text-muted-foreground">The requested course could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">{course.title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              {course.description || "No description available"}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>{course.chapters?.length || 0} Chapters</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{students?.length || 0} Students</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{course.duration || "N/A"}</span>
              </div>
            </div>
          </div>
          <Badge variant={course.status === "published" ? "default" : "secondary"} className="w-fit">
            {course.status}
          </Badge>
        </div>
      </div>

      {/* Course Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="syllabus" className="text-xs sm:text-sm">Syllabus</TabsTrigger>
          <TabsTrigger value="students" className="text-xs sm:text-sm">Students</TabsTrigger>
          <TabsTrigger value="chat" className="text-xs sm:text-sm">Chat</TabsTrigger>
        </TabsList>

        {/* Syllabus Tab */}
        <TabsContent value="syllabus" className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Course Syllabus</h2>
            {course.chapters && course.chapters.length > 0 ? (
              course.chapters.map((chapter) => (
                <Collapsible
                  key={chapter.id}
                  open={expandedChapters.has(chapter.id.toString())}
                  onOpenChange={() => toggleChapter(chapter.id.toString())}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3 sm:p-4 h-auto hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs sm:text-sm font-semibold text-primary">
                            {chapter.order || chapter.id}
                          </span>
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{chapter.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {chapter.description || "No description"}
                          </p>
                        </div>
                      </div>
                      {expandedChapters.has(chapter.id.toString()) ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 ml-6 sm:ml-12">
                    {chapter.content_items && chapter.content_items.length > 0 ? (
                      chapter.content_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                            {item.type === "video" && <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-secondary" />}
                            {item.type === "reading" && <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-secondary" />}
                            {item.type === "quiz" && <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-secondary" />}
                            {item.type === "assignment" && <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-secondary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-xs sm:text-sm truncate">{item.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.description || "No description"}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {item.type}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground italic p-2 sm:p-3">
                        No content items in this chapter
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8 sm:py-12">
                  <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No syllabus available</h3>
                  <p className="text-sm text-muted-foreground">
                    This course doesn't have any chapters or content yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Enrolled Students</h2>
            {studentsLoading ? (
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 sm:h-20 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : students && students.length > 0 ? (
              <div className="grid gap-3 sm:gap-4">
                {students.map((student) => (
                  <Card key={student.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm sm:text-lg font-semibold text-primary">
                              {student.full_name?.charAt(0) || "S"}
                            </span>
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <h4 className="font-semibold text-sm sm:text-base truncate">{student.full_name}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{student.email}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-muted-foreground">
                              <span>Joined: {new Date(student.created_at).toLocaleDateString()}</span>
                              <span>Last Active: {new Date(student.last_login || student.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs sm:text-sm font-medium">Progress:</span>
                            <span className="text-xs sm:text-sm">{student.progress || 0}%</span>
                          </div>
                          <Progress value={student.progress || 0} className="w-20 sm:w-24" />
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Target className="w-3 h-3" />
                              <span>Level: {student.expertise_level || "Beginner"}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3" />
                              <span>Score: {student.average_score || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8 sm:py-12">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No students enrolled</h3>
                  <p className="text-sm text-muted-foreground">
                    This course doesn't have any enrolled students yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Course Chat</h2>
            <p className="text-sm text-muted-foreground">
              Chat with students and provide course-specific guidance and support.
            </p>
            <ChatInterface courseId={courseId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherCourseView;
