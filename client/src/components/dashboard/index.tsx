import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SideNav } from "./side-nav";
import { WelcomeSection } from "./welcome-section";
import { GoalsCard } from "./goals-card";
import { WhatsNextCard } from "./whats-next-card";
import { TrendingTopicsCard } from "./trending-topics-card";
import { RecentActivityCard } from "./recent-activity-card";
// removed unused import
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DailyChallengeCard } from "./daily-challenge-card";
import { UserProfile, DashboardData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import CareerCoach from "@/pages/career-coach";

type DashboardProps = {
  userId: string;
};

export function Dashboard({ userId }: DashboardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const { toast } = useToast();

  // Get dashboard data
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: [`/api/dashboard/${userId}`],
    refetchOnWindowFocus: false,
  });

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Close sidebar when navigating from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-md p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't load your dashboard data. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (showCoach) {
    return <CareerCoach isOpen={true} onClose={() => setShowCoach(false)} />;
  }

  const { user, goals, activities, recommendations, trends, daily_challenge } = data;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Sidebar */}
      <SideNav
        user={user}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onCoachClick={() => setShowCoach(true)}
      />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 sm:px-6 shadow-sm">
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 w-10 text-foreground hover:bg-primary/10 hover:text-primary active:scale-95"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="sr-only">Toggle Menu</span>
          </button>

          <div className="flex-1">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Emerge Career Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Dashboard content */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Welcome Section */}
          <WelcomeSection username={user.name || user.username} />

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <DailyChallengeCard challenge={daily_challenge} />
            <WhatsNextCard userId={parseInt(userId)} />

            <GoalsCard goals={goals} userId={parseInt(userId)} />
            <TrendingTopicsCard userId={userId} />

            <RecentActivityCard activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
