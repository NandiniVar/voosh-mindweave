import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Bot, User, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
    sources?: Array<{
      title: string;
      url: string;
      relevance: number;
    }>;
  };
  isStreaming?: boolean;
}

export const ChatMessage = ({ message, isStreaming = false }: ChatMessageProps) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    toast({
      title: "Copied to clipboard",
      duration: 2000,
    });
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    toast({
      title: `Feedback recorded`,
      description: `Thank you for your ${type === 'up' ? 'positive' : 'negative'} feedback!`,
      duration: 2000,
    });
  };

  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <Avatar className="w-8 h-8 border-2 border-ai-glow shadow-glow">
          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <Card className={`max-w-[80%] p-4 ${
        isUser 
          ? 'bg-chat-bubble-user text-primary-foreground ml-auto' 
          : 'bg-gradient-card border-ai-glow/20 shadow-ai'
      }`}>
        <div className="space-y-3">
          <div className={`prose prose-sm max-w-none ${
            isUser ? 'text-primary-foreground' : 'text-foreground'
          }`}>
            <p className={`whitespace-pre-wrap ${isStreaming ? 'animate-type-writer' : ''}`}>
              {message.content}
            </p>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-ai-glow animate-pulse ml-1" />
            )}
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 p-3 bg-muted/50 rounded-md border border-ai-glow/10">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Sources ({message.sources.length})
              </p>
              <div className="space-y-1">
                {message.sources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ai-glow hover:text-ai-secondary transition-colors underline truncate max-w-[200px]"
                    >
                      {source.title}
                    </a>
                    <span className="text-muted-foreground">
                      {Math.round(source.relevance * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isUser && !isStreaming && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-7 w-7 p-0 hover:bg-ai-glow/10"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('up')}
                className={`h-7 w-7 p-0 hover:bg-ai-glow/10 ${
                  feedback === 'up' ? 'text-ai-glow' : ''
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('down')}
                className={`h-7 w-7 p-0 hover:bg-destructive/10 ${
                  feedback === 'down' ? 'text-destructive' : ''
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </Card>

      {isUser && (
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-secondary">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};