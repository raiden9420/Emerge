import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";

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
  thinkingStyle: string | null;
  extraInfo: string | null;
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

  // Fetch user data
  const { data: userData } = useQuery<UserData>({
    queryKey: ['/api/user/1'],
  });

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          userData
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
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
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response. Please try again."
      });
    }
  });

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now(),
      message: userInput,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setUserInput('');
    scrollToBottom();
    sendMessage(userInput);
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