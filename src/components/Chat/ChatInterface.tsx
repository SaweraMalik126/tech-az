import React, { useState } from 'react';
import { Send, Paperclip, Mic, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatInterfaceProps {
  courseId?: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'video' | 'slide' | 'quiz';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ courseId }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI tutor. How can I help you learn today?",
      role: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thanks for your message! AI tutor functionality is coming soon. For now, you can explore your courses and assignments.",
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[70vh] sm:h-[600px]">
      {/* Messages Area */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto chat-scrollbar space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-border bg-card">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your courses..."
              className="min-h-[48px] sm:min-h-[60px] pr-20 sm:pr-24 resize-none"
              rows={2}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden sm:flex">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="btn-hero h-[48px] sm:h-[60px] px-5 sm:px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-center">
          Ask me anything about your courses...
        </p>
      </div>
    </Card>
  );
};

export default ChatInterface;