import { useState } from 'react';
import { 
  Target, 
  BarChart3, 
  Calendar, 
  BookOpen, 
  MessageCircle, 
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { AIChat } from './AIChat';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Daily Log', href: '/daily-log', icon: BookOpen },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 animate-slide-in-right",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <h2 className="text-lg font-semibold text-sidebar-foreground">
                  Navigation
                </h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-all duration-200 hover:scale-105",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed && "px-3"
                  )}
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                  {!isCollapsed && item.name}
                </Button>
              );
            })}
          </nav>

          {/* AI Chat Toggle */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="default"
              className={cn(
                "w-full justify-start transition-all duration-200 hover:scale-105",
                "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md",
                isCollapsed && "px-3"
              )}
              onClick={() => setIsChatOpen(true)}
            >
              <MessageCircle className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
              {!isCollapsed && "AI Guidance"}
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border z-50 animate-slide-in-right shadow-2xl">
          <AIChat onClose={() => setIsChatOpen(false)} />
        </div>
      )}

      {/* Main content offset */}
      <div className={cn("transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")} />
    </>
  );
};