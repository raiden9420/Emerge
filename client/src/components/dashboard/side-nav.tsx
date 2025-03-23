import { Home, MessageSquare, Briefcase, Network, Settings, X } from "lucide-react";
import { useLocation } from "wouter";
import { UserProfile } from "@/lib/types";

interface SideNavProps {
  user: UserProfile;
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onCoachClick: () => void;
}

export function SideNav({ user, isMobile, isOpen, setIsOpen, onCoachClick }: SideNavProps) {
  const [location, setLocation] = useLocation();

  // Extract first letter of first and last name for avatar
  const getInitials = () => {
    if (!user.name) return "U";
    const parts = user.name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: Home,
      active: location === "/dashboard",
      onClick: () => setLocation("/dashboard"),
    },
    {
      label: "Career Coach",
      icon: MessageSquare,
      active: false,
      onClick: onCoachClick,
    },
    {
      label: "Explore Jobs",
      icon: Briefcase,
      active: false,
      onClick: () => {
        // Determine search keyword based on user's subjects
        const keyword = user.subjects && user.subjects.length > 0 
          ? encodeURIComponent(user.subjects[0]) 
          : "jobs";
        window.open(`https://www.linkedin.com/jobs/search/?keywords=${keyword}`, "_blank");
      },
    },
    {
      label: "Network",
      icon: Network,
      active: false,
      onClick: () => {},
    },
    {
      label: "Settings",
      icon: Settings,
      active: false,
      onClick: () => {},
    },
  ];

  const sidebarClasses = `
    bg-sidebar-background text-sidebar-foreground
    w-full md:w-64 flex-shrink-0
    transition-transform duration-300 ease-in-out 
    md:translate-x-0 z-40 md:z-0 border-r border-sidebar-border
    fixed md:sticky top-0 h-screen md:h-auto overflow-y-auto
    ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
  `;

  return (
    <div className={sidebarClasses}>
      {isMobile && (
        <button
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-sidebar-accent"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Profile Section */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || user.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
              {getInitials()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate">{user.name || user.username}</h2>
            <p className="text-sm text-sidebar-foreground/70 truncate">
              {user.subjects && user.subjects.length > 0 ? user.subjects[0] : "No subject selected"}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium">Level {user.level}</span>
            <span className="text-xs font-medium">{user.progress}%</span>
          </div>
          <div className="w-full bg-sidebar-accent rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${user.progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              item.onClick();
              if (isMobile) setIsOpen(false);
            }}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md 
              ${
                item.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
