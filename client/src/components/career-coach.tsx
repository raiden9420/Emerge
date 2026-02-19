import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";
import { Message, User } from "@/lib/types";

interface CareerCoachProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

export default function CareerCoach({ isOpen, onClose, userId }: CareerCoachProps) {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch user data for personalized coaching
  const { data: userData } = useQuery({
    queryKey: [`/api/user/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      return data.user as User;
    },
    enabled: isOpen && !!userId
  });

  // Fetch chat history
  const { data: chatHistoryData } = useQuery({
    queryKey: [`/api/chat-history/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/chat-history/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
      const data = await response.json();
      return data.chatHistory as Message[];
    },
    enabled: isOpen && !!userId
  });

  // Initialize with chat history or welcome message
  useEffect(() => {
    if (chatHistoryData && chatHistoryData.length > 0) {
      setMessages(chatHistoryData);
    } else if (userData && isOpen) {
      // Add initial welcome message if no history
      const subjects = userData.subjects?.join(", ") || "your field of study";
      const welcomeMessage: Message = {
        id: Date.now(),
        message: `I am Emerge, let's rise! How can I help you today? As ${subjects && subjects !== 'your field of study' ? `a ${subjects} student` : 'a student'}, I can help you explore career paths, internship opportunities, or answer questions about your academic journey.`,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [chatHistoryData, userData, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim() || isSending || !userData) return;

    const userMessage: Message = {
      id: Date.now(),
      message: userInput,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setUserInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userInput,
          userData
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const botMessage: Message = {
          id: Date.now(),
          message: data.response,
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response. Please try again."
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="bg-card shadow-sm py-4 px-4 flex items-center border-b border-border">
        <button 
          className="text-muted-foreground hover:text-foreground mr-4 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
          onClick={onClose}
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
              {msg.message}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-muted">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '600ms' }}></div>
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
          />
          <Button type="submit" disabled={isSending}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
