import React, { useState } from "react";
import { 
  BookOpen, 
  MessageCircle, 
  FileText,
  ChevronRight,
  ChevronDown,
  Play,
  Clock,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCourses, Course } from "@/hooks/useCourses";
import ChatInterface from "@/components/Chat/ChatInterface";

interface CourseViewProps {
  courseId: string;
}

const CourseView: React.FC<CourseViewProps> = ({ courseId }) => {
  const { courses, loading } = useCourses();
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("syllabus");

  const course = courses.find(c => c.id.toString() === courseId);

  const toggleChapter = (chapterId: number) => {
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
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Course Not Found</h3>
        <p className="text-muted-foreground">
          The requested course could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Course Header */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="p-2 sm:p-3 bg-primary text-white rounded-xl w-fit">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">{course.title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {course.description || "Course description not available"}
            </p>
          </div>
        </div>
        
        {/* Course Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{course.chapters?.length || 0} Chapters</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>{course.progress || 0}% Complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <FileText className="w-4 h-4" />
            <span>{course.language?.toUpperCase() || 'EN'}</span>
          </div>
        </div>
      </div>

      {/* Course Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="syllabus" className="text-xs sm:text-sm">Syllabus</TabsTrigger>
          <TabsTrigger value="tutor" className="text-xs sm:text-sm">Tutor</TabsTrigger>
          <TabsTrigger value="assessment" className="text-xs sm:text-sm">Assessment</TabsTrigger>
        </TabsList>

        {/* Syllabus Tab */}
        <TabsContent value="syllabus" className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Course Syllabus</h2>
            {course.chapters && course.chapters.length > 0 ? (
              course.chapters.map((chapter) => (
                <Collapsible
                  key={chapter.id}
                  open={expandedChapters.has(chapter.id)}
                  onOpenChange={() => toggleChapter(chapter.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3 sm:p-4 h-auto hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs sm:text-sm font-semibold text-primary">
                            {chapter.position || chapter.id}
                          </span>
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{chapter.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {chapter.description || "No description"}
                          </p>
                        </div>
                      </div>
                      {expandedChapters.has(chapter.id) ? (
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
                            {item.type === "quiz" && <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-secondary" />}
                            {item.type === "assignment" && <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-secondary" />}
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

        {/* Tutor Tab */}
        <TabsContent value="tutor" className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">AI Tutor</h2>
            <p className="text-sm text-muted-foreground">
              Get personalized help and guidance for this specific course.
            </p>
            <ChatInterface courseId={courseId} />
          </div>
        </TabsContent>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Assessment</h2>
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Assessment Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  Assessment features are currently under development.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseView;
