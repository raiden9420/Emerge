import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Survey from "@/pages/survey";
import Dashboard from "@/pages/dashboard";
import CareerCoach from "@/pages/career-coach";
import Index from "./pages/index";
import AuthPage from "@/pages/auth";
import Settings from "@/pages/settings"; // Import the Settings component

function Router() {
  const [location, setLocation] = useLocation();

  // Check if user should be redirected based on authentication status
  useEffect(() => {
    const userId = localStorage.getItem('userId');

    // If we're not on the auth page and there's no userId, redirect to auth
    if (location !== "/auth" && !userId && (location !== "/")) {
      setLocation("/auth");
    }

    // If user is on the root path, redirect to dashboard if logged in, auth if not
    if (location === "/") {
      if (userId) {
        setLocation("/dashboard");
      } else {
        setLocation("/auth");
      }
    }
  }, [location, setLocation]);

  return (
    <Switch>
      <Route path="/" component={Index} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/survey" component={Survey} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} /> {/* Added settings route */}
      <Route path="/career-coach" component={CareerCoach} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;