import React from 'react';
import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start space-x-3 message-slide-in">
      {/* AI Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="bg-ai-primary text-white text-xs font-medium">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>

      {/* Typing Animation */}
      <Card className="p-4 bg-card text-card-foreground shadow-sm">
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-ai-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-ai-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-ai-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-sm text-muted-foreground ml-2">AI is typing...</span>
        </div>
      </Card>
    </div>
  );
};

export default TypingIndicator;