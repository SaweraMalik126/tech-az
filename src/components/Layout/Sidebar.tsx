import React from 'react';
import { 
  MessageCircle, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  ChevronDown,
  GraduationCap,
  BarChart3,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  open: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, activeView, setActiveView }) => {
  const [coursesOpen, setCoursesOpen] = React.useState(true);
  const [progressOpen, setProgressOpen] = React.useState(true);
  
  const { courses, loading } = useCourses();
  const { profile } = useAuth();
  
  const inProgressCourses = courses.filter(course => (course.progress || 0) > 0 && (course.progress || 0) < 100);
  const completedCourses = courses.filter(course => (course.progress || 0) >= 100);

  return (
    <TooltipProvider>
      <aside className={cn(
        "bg-card border-r border-border transition-all duration-300 h-[calc(100vh-80px)] sticky top-20",
        open ? "w-80" : "w-16"
      )}>
        <div className="p-4 space-y-2 h-full overflow-y-auto">
          {/* General Chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === 'general-chat' ? 'default' : 'ghost'}
                className={cn(
                  "w-full justify-start",
                  !open && "px-2"
                )}
                onClick={() => setActiveView('general-chat')}
              >
                <MessageCircle className="w-5 h-5" />
                {open && <span className="ml-3">General Chat</span>}
              </Button>
            </TooltipTrigger>
            {!open && (
              <TooltipContent side="right">
                <p>General Chat</p>
              </TooltipContent>
            )}
          </Tooltip>

          {/* Courses in Progress */}
          <Collapsible open={progressOpen} onOpenChange={setProgressOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      !open && "px-2"
                    )}
                  >
                    <Clock className="w-5 h-5" />
                    {open && (
                      <>
                        <span className="ml-3 flex-1 text-left">Courses in Progress</span>
                        {progressOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </TooltipTrigger>
              {!open && (
                <TooltipContent side="right">
                  <p>Courses in Progress</p>
                </TooltipContent>
              )}
            </Tooltip>
            <CollapsibleContent className={cn(
              "space-y-2",
              open ? "ml-6" : "ml-2"
            )}>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="space-y-2">
                        <div className="h-8 bg-muted animate-pulse rounded" />
                        <div className="h-2 bg-muted animate-pulse rounded ml-6" />
                      </div>
                    ))}
                  </div>
                ) : inProgressCourses.length > 0 ? (
                  inProgressCourses.map((course) => (
                    <div key={course.id} className="space-y-1">
                      <Button
                        variant={activeView === `course-${course.id}` ? 'secondary' : 'ghost'}
                        className={cn(
                          "w-full justify-start text-sm",
                          !open && "px-2 h-8"
                        )}
                        onClick={() => setActiveView(`course-${course.id}`)}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        {open && course.title}
                      </Button>
                      {open && (
                        <div className="ml-6">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{course.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="progress-bar h-2 rounded-full"
                              style={{ width: `${course.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  open && <p className="text-xs text-muted-foreground px-2">No courses in progress</p>
                )}
              </CollapsibleContent>
            </Collapsible>

          {/* Courses Available */}
          <Collapsible open={coursesOpen} onOpenChange={setCoursesOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      !open && "px-2"
                    )}
                  >
                    <BookOpen className="w-5 h-5" />
                    {open && (
                      <>
                        <span className="ml-3 flex-1 text-left">Courses Available</span>
                        {coursesOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </TooltipTrigger>
              {!open && (
                <TooltipContent side="right">
                  <p>Courses Available</p>
                </TooltipContent>
              )}
            </Tooltip>
            <CollapsibleContent className={cn(
              "space-y-1",
              open ? "ml-6" : "ml-2"
            )}>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : courses.length > 0 ? (
                  courses.map((course) => (
                    <Button
                      key={course.id}
                      variant={activeView === `course-${course.id}` ? 'secondary' : 'ghost'}
                      className={cn(
                        "w-full justify-start text-sm",
                        !open && "px-2 h-8"
                      )}
                      onClick={() => setActiveView(`course-${course.id}`)}
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {open && course.title}
                    </Button>
                  ))
                ) : (
                  open && <p className="text-xs text-muted-foreground px-2">No courses available</p>
                )}
              </CollapsibleContent>
            </Collapsible>

          {/* Completed Courses */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === 'completed-courses' ? 'default' : 'ghost'}
                className={cn(
                  "w-full justify-start",
                  !open && "px-2"
                )}
                onClick={() => setActiveView('completed-courses')}
              >
                <Trophy className="w-5 h-5" />
                {open && <span className="ml-3">Completed Courses</span>}
              </Button>
            </TooltipTrigger>
            {!open && (
              <TooltipContent side="right">
                <p>Completed Courses</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;