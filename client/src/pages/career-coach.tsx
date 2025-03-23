import { useState, useEffect, useRef } from "react";
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

interface CareerCoachProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CareerCoach({ isOpen, onClose }: CareerCoachProps) {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Get user ID from localStorage
  const userId = localStorage.getItem('userId');

  // Fetch user data
  const { data: userData } = useQuery<UserData>({
    queryKey: [`/api/user/${userId}`],
    enabled: !!userId,
  });

  // Fetch chat history
  const { data: chatHistory } = useQuery<{success: boolean, messages: Message[]}>({
    queryKey: [`/api/chat/${userId}`],
    enabled: !!userId,
    onSuccess: (data) => {
      if (data?.success && data.messages) {
        setMessages(data.messages);
        scrollToBottom();
      }
    }
  });

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (message: string) => {
      if (!userId) throw new Error("User ID not found");
      
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
        throw new Error(`HTTP error! status: ${userMessageResponse.status}`);
      }

      // Get bot response
      const botResponse = await fetch('/api/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          userData
        })
      });

      if (!botResponse.ok) {
        throw new Error(`HTTP error! status: ${botResponse.status}`);
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
        message: `I am Emerge, let's rise! How can I help you today?\n\nI can see you're ${userData.subjects?.[0] ? `studying ${userData.subjects[0]}` : 'interested in career development'} and your goal is ${userData.goal || 'career growth'}. I'm here to help you achieve that goal.`,
        sender: 'bot' as const,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [userData, messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim() || isSending) return;

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
    sendMessage(userInput);
  };

  // If component is not open, handle accordingly
  if (!isOpen) {
    if (onClose) {
      // When used as a modal
      return null;
    } else {
      // When accessed directly via route
      useEffect(() => {
        // If not open and accessed directly, go to dashboard
        if (!userId) {
          navigate('/survey');
          return;
        }
      }, [userId, navigate]);
      
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading your coach...</p>
          </div>
        </div>
      );
    }
  }

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
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {msg.message.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-muted">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-150"></div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button type="submit" disabled={isSending || !userInput.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
