import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) navigate("/feed");
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) navigate("/feed");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (session) {
    return null; // Will redirect to feed
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center space-y-8 animate-fade-up">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
            Welcome to Spiral
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto">
            Connect with friends, share moments, and discover stories that matter to you.
          </p>
        </div>

        <div className="w-full max-w-[400px] p-4 bg-card rounded-lg shadow-sm border">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'rgb(var(--primary))',
                    brandAccent: 'rgb(var(--primary))',
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={window.location.origin + "/feed"}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 bg-card rounded-lg shadow-sm border animate-fade-up" style={{ animationDelay: "100ms" }}>
            <h3 className="font-semibold text-lg mb-2">Share Moments</h3>
            <p className="text-muted-foreground">Post photos, videos, and thoughts with your community.</p>
          </div>
          
          <div className="p-6 bg-card rounded-lg shadow-sm border animate-fade-up" style={{ animationDelay: "200ms" }}>
            <h3 className="font-semibold text-lg mb-2">Connect</h3>
            <p className="text-muted-foreground">Follow friends and join conversations that matter to you.</p>
          </div>
          
          <div className="p-6 bg-card rounded-lg shadow-sm border animate-fade-up" style={{ animationDelay: "300ms" }}>
            <h3 className="font-semibold text-lg mb-2">Discover</h3>
            <p className="text-muted-foreground">Explore trending topics and find new perspectives.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;