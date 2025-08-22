import React, { useState } from 'react';
import { 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Send, 
  CheckCircle,
  TrendingUp,
  BarChart3,
  FileText,
  Lightbulb,
  Heart,
  AlertCircle,
  Smile,
  Meh,
  Frown,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';

interface FeedbackPageProps {
  userRole: 'student' | 'teacher';
}

interface FeedbackSubmission {
  id: string;
  type: 'general' | 'course' | 'feature' | 'bug' | 'improvement';
  title: string;
  description: string;
  rating: number;
  category: string;
  status: 'submitted' | 'reviewing' | 'implemented' | 'declined';
  createdAt: string;
  updatedAt: string;
}

interface FeedbackStats {
  totalSubmissions: number;
  averageRating: number;
  satisfactionScore: number;
  topCategories: { category: string; count: number }[];
  recentTrend: 'improving' | 'stable' | 'declining';
}

const FeedbackPage: React.FC<FeedbackPageProps> = ({ userRole }) => {
  const { profile } = useAuth();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    type: '',
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  });

  // Sample feedback submissions - this would come from your backend
  const sampleFeedback: FeedbackSubmission[] = [
    {
      id: '1',
      type: 'feature',
      title: 'Dark mode support',
      description: 'Would love to have a dark mode option for better visibility in low-light conditions.',
      rating: 5,
      category: 'UI/UX',
      status: 'reviewing',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      type: 'improvement',
      title: 'Mobile app improvements',
      description: 'The mobile experience could be enhanced with better touch controls and responsive design.',
      rating: 4,
      category: 'Mobile',
      status: 'implemented',
      createdAt: '2024-01-10T14:20:00Z',
      updatedAt: '2024-01-12T09:15:00Z'
    },
    {
      id: '3',
      type: 'bug',
      title: 'Assignment submission error',
      description: 'Getting an error when trying to submit assignments on mobile devices.',
      rating: 2,
      category: 'Technical',
      status: 'submitted',
      createdAt: '2024-01-08T16:45:00Z',
      updatedAt: '2024-01-08T16:45:00Z'
    }
  ];

  // Sample feedback statistics - this would come from your backend
  const feedbackStats: FeedbackStats = {
    totalSubmissions: 47,
    averageRating: 4.2,
    satisfactionScore: 84,
    topCategories: [
      { category: 'UI/UX', count: 15 },
      { category: 'Mobile', count: 12 },
      { category: 'Performance', count: 8 },
      { category: 'Features', count: 6 }
    ],
    recentTrend: 'improving'
  };

  const handleSubmitFeedback = async () => {
    try {
      // Here you would submit the feedback to your backend
      // For now, we'll just show a success message
      setFeedbackSubmitted(true);
      setShowFeedbackForm(false);
      setFeedbackForm({ type: '', title: '', description: '', category: '', priority: 'medium' });
      setSelectedRating(0);
      setTimeout(() => setFeedbackSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewing': return 'bg-yellow-100 text-yellow-800';
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Lightbulb className="w-4 h-4" />;
      case 'improvement': return <TrendingUp className="w-4 h-4" />;
      case 'bug': return <AlertCircle className="w-4 h-4" />;
      case 'course': return <FileText className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-purple-100 text-purple-800';
      case 'improvement': return 'bg-blue-100 text-blue-800';
      case 'bug': return 'bg-red-100 text-red-800';
      case 'course': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRatingStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <button
        key={index}
        type="button"
        className={`w-8 h-8 transition-colors ${
          index < (hoveredRating || selectedRating)
            ? 'text-yellow-400 hover:text-yellow-500'
            : 'text-gray-300 hover:text-gray-400'
        }`}
        onClick={() => setSelectedRating(index + 1)}
        onMouseEnter={() => setHoveredRating(index + 1)}
        onMouseLeave={() => setHoveredRating(0)}
      >
        <Star className="w-full h-full fill-current" />
      </button>
    ));
  };

  const getSatisfactionIcon = (score: number) => {
    if (score >= 80) return <Smile className="w-6 h-6 text-green-500" />;
    if (score >= 60) return <Meh className="w-6 h-6 text-yellow-500" />;
    return <Frown className="w-6 h-6 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Feedback & Suggestions</h1>
        <p className="text-muted-foreground">
          Help us improve TeachMe.ai by sharing your thoughts and ideas
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowFeedbackForm(true)}>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Submit Feedback</h3>
            <p className="text-sm text-muted-foreground">Share your thoughts and suggestions</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Lightbulb className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Feature Requests</h3>
            <p className="text-sm text-muted-foreground">Request new features and improvements</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">View Analytics</h3>
            <p className="text-sm text-muted-foreground">See how your feedback impacts the platform</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Feedback Statistics */}
        <div className="space-y-6">
          {/* Overall Satisfaction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Overall Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {getSatisfactionIcon(feedbackStats.satisfactionScore)}
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {feedbackStats.satisfactionScore}%
                </div>
                <p className="text-sm text-muted-foreground">Satisfaction Score</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Average Rating</span>
                  <span className="font-medium">{feedbackStats.averageRating}/5</span>
                </div>
                <Progress value={feedbackStats.averageRating * 20} className="w-full" />
              </div>
              
              <div className="text-center">
                <Badge 
                  variant="outline" 
                  className={`${
                    feedbackStats.recentTrend === 'improving' ? 'text-green-600 border-green-600' :
                    feedbackStats.recentTrend === 'declining' ? 'text-red-600 border-red-600' :
                    'text-yellow-600 border-yellow-600'
                  }`}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {feedbackStats.recentTrend.charAt(0).toUpperCase() + feedbackStats.recentTrend.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Top Feedback Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {feedbackStats.topCategories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{category.category}</span>
                    <span className="font-medium">{category.count}</span>
                  </div>
                  <Progress 
                    value={(category.count / Math.max(...feedbackStats.topCategories.map(c => c.count))) * 100} 
                    className="w-full" 
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ThumbsUp className="w-5 h-5 mr-2" />
                Quick Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <ThumbsUp className="w-4 h-4 mr-2" />
                I love this feature!
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <ThumbsDown className="w-4 h-4 mr-2" />
                This needs improvement
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Lightbulb className="w-4 h-4 mr-2" />
                I have an idea
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <AlertCircle className="w-4 h-4 mr-2" />
                Report a bug
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Middle & Right Columns - My Feedback & Recent Submissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Feedback Submissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                My Feedback Submissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sampleFeedback.length > 0 ? (
                sampleFeedback.map((feedback) => (
                  <div key={feedback.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getTypeColor(feedback.type)}>
                            {getTypeIcon(feedback.type)}
                            <span className="ml-1">{feedback.type}</span>
                          </Badge>
                          <Badge className={getStatusColor(feedback.status)}>
                            {feedback.status}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">{feedback.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feedback.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            className={`w-4 h-4 ${
                              index < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Category: {feedback.category}</span>
                      <span>Submitted: {new Date(feedback.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No feedback submissions yet.</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => setShowFeedbackForm(true)}
                  >
                    Submit Feedback
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Community Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Community Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  See what other users are saying about TeachMe.ai
                </p>
                <Button variant="outline">
                  View Community Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="feedback-type">Feedback Type</Label>
                <Select value={feedbackForm.type} onValueChange={(value) => setFeedbackForm({ ...feedbackForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Feedback</SelectItem>
                    <SelectItem value="course">Course Related</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="improvement">Improvement Suggestion</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="feedback-title">Title</Label>
                <Input
                  id="feedback-title"
                  value={feedbackForm.title}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
                  placeholder="Brief description of your feedback"
                />
              </div>
              
              <div>
                <Label htmlFor="feedback-category">Category</Label>
                <Select value={feedbackForm.category} onValueChange={(value) => setFeedbackForm({ ...feedbackForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UI/UX">UI/UX</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="Performance">Performance</SelectItem>
                    <SelectItem value="Features">Features</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="feedback-priority">Priority</Label>
                <Select value={feedbackForm.priority} onValueChange={(value) => setFeedbackForm({ ...feedbackForm, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Rating</Label>
                <div className="flex justify-center space-x-1 mt-2">
                  {renderRatingStars()}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {selectedRating > 0 ? `You rated this ${selectedRating} out of 5` : 'Click to rate'}
                </p>
              </div>
              
              <div>
                <Label htmlFor="feedback-description">Description</Label>
                <Textarea
                  id="feedback-description"
                  value={feedbackForm.description}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
                  placeholder="Please provide detailed feedback, suggestions, or describe the issue..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowFeedbackForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackForm.type || !feedbackForm.title || !feedbackForm.description || selectedRating === 0}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Message */}
      {feedbackSubmitted && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>Feedback submitted successfully! Thank you for your input.</span>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
