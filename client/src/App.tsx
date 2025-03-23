import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Survey from "@/pages/survey";
import Dashboard from "@/pages/dashboard";
import CareerCoach from "@/pages/career-coach";
import Index from "./pages/index";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Index} />
      <Route path="/survey" component={Survey} />
      <Route path="/dashboard" component={Dashboard} />
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
