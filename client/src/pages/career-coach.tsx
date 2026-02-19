import { useState, useEffect, useRef, FormEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";
import { useLocation } from "wouter";

type Message = {
  id: number;
  message: string;
  sender: 'user' | 'bot';
  timestamp: string;
};

// Simple formatter for chat messages
const FormattedMessage = ({ content }: { content: string }) => {
  const renderBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {content.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className="text-primary/70 mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
              <span>{renderBold(trimmed.substring(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderBold(line)}</p>;
      })}
    </div>
  );
};

type UserData = {
  id: number;
  username: string;
  subjects: string[] | null;
  interests: string[] | null;
  skills: string[] | null;
  goal: string | null;
  thinking_style: string | null;
  extra_info: string | null;
};

type ApiResponse = {
  success: boolean;
  user: UserData;
};

interface CareerCoachProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CareerCoach({ isOpen = true, onClose }: CareerCoachProps) {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Get user ID from localStorage
  const userId = localStorage.getItem('userId');

  // Fetch user data
  // Fetch user data
  const { data: apiResponse, isLoading: isUserDataLoading } = useQuery<ApiResponse>({
    queryKey: [`/api/user/${userId}`],
    enabled: !!userId,
  });

  const userData = apiResponse?.user;

  // Fetch chat history
  const { data: chatHistory } = useQuery<{ success: boolean, messages: Message[] }>({
    queryKey: [`/api/chat/${userId}`],
    enabled: !!userId
  });

  // Update messages when chat history is loaded
  useEffect(() => {
    if (chatHistory?.success && chatHistory.messages) {
      setMessages(chatHistory.messages);
      scrollToBottom();
    }
  }, [chatHistory]);

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async ({ message, userData: ud }: { message: string; userData: UserData }) => {
      if (!userId) throw new Error("User ID not found");
      if (!ud) throw new Error("User data not loaded");

      // Save user message
      const userMessageResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(userId),
          message,
          sender: 'user'
        })
      });

      if (!userMessageResponse.ok) {
        throw new Error(`Chat history save failed: ${userMessageResponse.status}`);
      }

      // Get bot response
      const botResponse = await fetch('/api/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userData: ud
        })
      });

      if (!botResponse.ok) {
        const errorText = await botResponse.text();
        throw new Error(`Career coach API failed: ${botResponse.status} - ${errorText}`);
      }

      return botResponse.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // Add bot's response to messages
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: Date.now(),
            message: data.response,
            sender: 'bot',
            timestamp: new Date().toISOString()
          }
        ]);
        scrollToBottom();
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get a response. Please try again."
      });
    }
  });

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current!.scrollTop = chatContainerRef.current!.scrollHeight;
      }, 100);
    }
  };

  useEffect(() => {
    // Show welcome message if no messages yet
    if (messages.length === 0 && userData) {
      const welcomeMessage = {
        id: 0,
        message: `I am **Emerge**, let's rise! How can I help you today?\n\nI can see you're interested in **${userData.subjects?.[0] || 'career development'}** and your goal is **${userData.goal || 'growth'}**.\n\nI'm here to help you achieve that goal.`,
        sender: 'bot' as const,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [userData, messages.length]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!userInput.trim() || isSending || !userData) return;

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now(),
      message: userInput,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setUserInput('');
    scrollToBottom();

    // Send message to backend
    sendMessage({ message: userInput, userData });
  };

  // Check if user is logged in when component is accessed directly as a route
  useEffect(() => {
    // If accessed without a userId, redirect to auth
    if (!userId) {
      navigate('/auth');
    }
  }, [userId, navigate]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="bg-card shadow-sm py-4 px-4 flex items-center border-b border-border">
        <button
          className="text-muted-foreground hover:text-foreground mr-4 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
          onClick={onClose || (() => navigate('/dashboard'))}
          aria-label="Back"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Career Coach</h1>
      </header>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted/80 backdrop-blur-sm border border-border/50 rounded-bl-sm'
                }`}
            >
              <FormattedMessage content={msg.message} />
              <div className={`text-[10px] mt-1 opacity-70 ${msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3 bg-muted/50 border border-border/50">
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"></div>
              </div>
              <span className="sr-only">Emerge is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex gap-2 items-end">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending || isUserDataLoading}
            className="flex-1 min-h-[44px] rounded-full px-4 shadow-sm bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary transition-all"
          />
          <Button
            type="submit"
            disabled={isSending || !userInput.trim() || isUserDataLoading}
            size="icon"
            className="h-11 w-11 rounded-full shadow-sm shrink-0"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
