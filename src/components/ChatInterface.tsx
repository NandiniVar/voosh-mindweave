import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "./ChatMessage";
import { Send, RotateCcw, Settings, Database, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: Array<{
    title: string;
    url: string;
    relevance: number;
  }>;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [isIngestingData, setIsIngestingData] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateRAGResponse = async (userMessage: string): Promise<Message> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Mock sources based on user query
    const mockSources = [
      {
        title: "Latest Technology News",
        url: "https://example.com/tech-news",
        relevance: 0.95
      },
      {
        title: "Research Article on AI",
        url: "https://example.com/ai-research", 
        relevance: 0.87
      },
      {
        title: "Industry Report 2024",
        url: "https://example.com/industry-report",
        relevance: 0.73
      }
    ];

    const responses = [
      `Based on the latest news articles I've analyzed, here's what I found regarding "${userMessage}": 

The current trends show significant developments in this area. Recent reports indicate that technological advancements are accelerating rapidly, with new innovations emerging weekly.

Key points from my knowledge base:
• Market analysis suggests continued growth
• Expert opinions are generally positive
• Recent studies support these findings

Would you like me to elaborate on any specific aspect?`,
      
      `I've searched through my knowledge base and found relevant information about "${userMessage}". 

From the documentation I have access to, it appears that this topic has gained significant attention recently. The retrieved articles suggest several important considerations:

1. **Current Status**: The field is evolving rapidly
2. **Future Outlook**: Experts predict continued innovation
3. **Best Practices**: Industry standards are being established

The sources I referenced provide comprehensive coverage of this topic.`,
      
      `Let me provide you with insights about "${userMessage}" based on my analysis of recent articles and reports.

According to the retrieved documents, this is a particularly interesting area with several key developments:

• **Recent Updates**: New information has emerged in the past few months
• **Expert Analysis**: Leading researchers are optimistic about future prospects  
• **Practical Applications**: Real-world implementations are showing promising results

The information comes from verified news sources and research publications in my knowledge base.`
    ];

    return {
      id: `msg-${Date.now()}-${Math.random()}`,
      content: responses[Math.floor(Math.random() * responses.length)],
      role: "assistant",
      timestamp: new Date(),
      sources: mockSources.slice(0, 2 + Math.floor(Math.random() * 2))
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Add streaming placeholder
      const streamingId = `streaming-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: streamingId,
        content: "Thinking...",
        role: "assistant",
        timestamp: new Date(),
      }]);

      const response = await simulateRAGResponse(input.trim());
      
      // Replace streaming message with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === streamingId ? response : msg
      ));

      toast({
        title: "Response generated",
        description: "Retrieved relevant information from knowledge base",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
      
      // Remove streaming message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('streaming-')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSession = () => {
    setMessages([]);
    toast({
      title: "Session reset",
      description: "Chat history has been cleared",
    });
  };

  const handleIngestData = async () => {
    setIsIngestingData(true);
    try {
      // Simulate data ingestion
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast({
        title: "Data ingestion complete",
        description: "Knowledge base has been updated with latest articles",
      });
    } catch (error) {
      toast({
        title: "Ingestion failed",
        description: "Failed to update knowledge base",
        variant: "destructive",
      });
    } finally {
      setIsIngestingData(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow animate-glow-pulse">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">RAG Assistant</h1>
              <p className="text-sm text-muted-foreground">Powered by retrieval-augmented generation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Session: {sessionId.slice(-8)}
            </Badge>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>System Controls</DialogTitle>
                  <DialogDescription>
                    Manage your RAG assistant settings and data
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button 
                    onClick={handleIngestData} 
                    disabled={isIngestingData}
                    className="w-full"
                    variant="outline"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    {isIngestingData ? "Ingesting..." : "Update Knowledge Base"}
                  </Button>
                  <Button 
                    onClick={handleResetSession}
                    variant="destructive"
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Session
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-[60vh]">
                <Card className="p-8 max-w-md text-center bg-gradient-card border-ai-glow/20">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow animate-float">
                    <Brain className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Welcome to RAG Assistant</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Ask me anything! I'll search through my knowledge base of news articles and research papers to provide accurate, sourced answers.
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>• Real-time information retrieval</p>
                    <p>• Source attribution</p>
                    <p>• Context-aware responses</p>
                  </div>
                </Card>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  isStreaming={message.id.startsWith('streaming-')}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Input Area */}
      <div className="p-4 bg-gradient-card">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about current events, technology, or research..."
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
            className="flex-1 bg-background border-ai-glow/20 focus:border-ai-glow transition-colors"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Responses are generated using retrieval-augmented generation with real-time source attribution
        </p>
      </div>
    </div>
  );
};