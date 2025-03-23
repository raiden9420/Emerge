import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  GraduationCap, 
  Briefcase,
  BookOpen,
  Settings,
  HelpCircle,
  Menu
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { User } from "@/lib/types";

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile menu toggle button */}
      {isMobile && (
        <button 
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-background rounded-md shadow-sm"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}
      
      {/* Sidebar */}
      <aside 
        className={`bg-sidebar-background border-r border-sidebar-border w-64 flex-shrink-0 transition-transform duration-300 h-screen fixed md:sticky top-0 z-40 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center p-4 border-b border-sidebar-border h-16">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="ml-2 font-semibold text-lg">Emerge</span>
          </div>
          
          {/* User Profile */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 border-2 border-primary/30">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">
                  {user.subjects?.length ? user.subjects[0] : 'Student'}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Level {user.level || 1} Journey</span>
                <span>{user.progress || 0}%</span>
              </div>
              <Progress value={user.progress || 0} className="h-2" />
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link href="/dashboard">
              <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location === '/dashboard' 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } transition-colors`}>
                <Home className="h-5 w-5 mr-2" />
                Dashboard
              </a>
            </Link>
            <Link href="/career-coach">
              <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location === '/career-coach' 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } transition-colors`}>
                <GraduationCap className="h-5 w-5 mr-2" />
                Career Coach
              </a>
            </Link>
            <a 
              href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(user.subjects?.[0] || '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Briefcase className="h-5 w-5 mr-2" />
              Explore Jobs
            </a>
            <Link href="/resources">
              <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location === '/resources' 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } transition-colors`}>
                <BookOpen className="h-5 w-5 mr-2" />
                Learning Resources
              </a>
            </Link>
          </nav>
          
          {/* Bottom Section */}
          <div className="p-4 border-t border-sidebar-border">
            <Link href="/survey">
              <a className={`flex items-center px-3 py-2 w-full text-sm font-medium rounded-md ${
                location === '/survey' 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } transition-colors mb-1`}>
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </a>
            </Link>
            
          </div>
        </div>
      </aside>
    </>
  );
}
