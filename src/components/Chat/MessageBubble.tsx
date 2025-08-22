import React from 'react';
import { Play, FileText, HelpCircle, User, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'video' | 'slide' | 'quiz';
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const getIcon = () => {
    switch (message.type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'slide':
        return <FileText className="w-4 h-4" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = () => {
    switch (message.type) {
      case 'video':
        return 'VIDEO';
      case 'slide':
        return 'SLIDE';
      case 'quiz':
        return 'QUIZ';
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "flex items-start space-x-3 message-slide-in",
      isUser ? "flex-row-reverse space-x-reverse" : ""
    )}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={cn(
          "text-xs font-medium",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-ai-primary text-white"
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn(
        "max-w-[80%] sm:max-w-[70%]",
        isUser ? "items-end" : "items-start"
      )}>
        <Card className={cn(
          "p-4 shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-card text-card-foreground"
        )}>
          {/* Type Badge */}
          {message.type && !isUser && (
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center space-x-1 px-2 py-1 bg-ai-secondary text-ai-primary rounded-full text-xs font-medium">
                {getIcon()}
                <span>{getTypeLabel()}</span>
              </div>
            </div>
          )}

          {/* Message Text */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Interactive Elements for special message types */}
          {message.type === 'video' && !isUser && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <Play className="w-5 h-5" />
                <span className="text-sm">Video content would be embedded here</span>
              </div>
            </div>
          )}

          {message.type === 'slide' && !isUser && (
            <div className="mt-3 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <h4 className="font-medium text-sm mb-2">Mathematical Definition</h4>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border text-center">
                  <code className="text-sm">f'(x) = lim(h→0) [f(x+h) - f(x)]/h</code>
                </div>
              </div>
            </div>
          )}

          {message.type === 'quiz' && !isUser && (
            <div className="mt-3 space-y-2">
              <Button variant="outline" size="sm" className="w-full text-left">
                Start Practice Quiz
              </Button>
            </div>
          )}
        </Card>

        {/* Timestamp */}
        <p className={cn(
          "text-xs text-muted-foreground mt-1 px-1",
          isUser ? "text-right" : "text-left"
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;