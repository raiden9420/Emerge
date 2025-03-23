import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Dashboard } from "@/components/dashboard";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check for user ID in localStorage
    const storedUserId = localStorage.getItem("userId");
    
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // If no user ID, redirect to survey
      setLocation("/survey");
    }
  }, [setLocation]);

  // If userId is still null, show loading state
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return <Dashboard userId={userId} />;
}
