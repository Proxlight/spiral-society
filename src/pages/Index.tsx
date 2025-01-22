import { Layout } from "@/components/Layout";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) navigate("/feed");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) navigate("/feed");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (session) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center space-y-8 px-4 md:px-0">
        <div className="space-y-6 w-full max-w-[400px] animate-fade-in">
          <div className="flex flex-col items-center space-y-4">
            {/* Spiral Mail Logo */}
            <div className="relative w-12 h-12 md:w-16 md:h-16 animate-float">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center transform hover:scale-105 transition-transform">
                <Mail className="w-6 h-6 md:w-8 md:h-8 text-white animate-[spin_3s_linear_infinite]" />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Spiral Society
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-[300px] mx-auto">
              Join the conversation, share your thoughts, connect with others.
            </p>
          </div>

          <div className="w-full bg-card rounded-lg shadow-lg border p-6 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: { 
                    background: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderRadius: '0.5rem',
                  },
                  anchor: { 
                    color: 'hsl(var(--primary))',
                    fontWeight: '500',
                  },
                  input: {
                    borderRadius: '0.5rem',
                  },
                },
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(var(--primary))',
                      brandAccent: 'hsl(var(--primary))',
                    },
                  },
                },
              }}
              providers={[]}
              redirectTo={window.location.origin + "/feed"}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>By signing up, you agree to our Terms and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;