import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, User, Bell, Search, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (!session && location.pathname !== '/') {
        navigate('/');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session && location.pathname !== '/') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate]);
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl mx-auto px-4 pb-16">
        {children}
      </main>
      
      {isAuthenticated && location.pathname !== '/' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border py-2 px-4 md:py-3">
          <div className="container max-w-2xl mx-auto">
            <div className="flex items-center justify-around">
              <Link
                to="/feed"
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive("/feed") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Home className="h-6 w-6" />
                <span className="text-xs">Home</span>
              </Link>
              
              <Link
                to="/search"
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive("/search") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Search className="h-6 w-6" />
                <span className="text-xs">Search</span>
              </Link>
              
              <Link
                to="/hope"
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive("/hope") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className="h-6 w-6" />
                <span className="text-xs">Hope</span>
              </Link>
              
              <Link
                to="/notifications"
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive("/notifications") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bell className="h-6 w-6" />
                <span className="text-xs">Notifications</span>
              </Link>
              
              <Link
                to="/profile"
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive("/profile") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="h-6 w-6" />
                <span className="text-xs">Profile</span>
              </Link>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}