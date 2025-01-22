import { Layout } from "@/components/Layout";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail } from "lucide-react";
import { RainbowButton } from "@/components/ui/rainbow-button";

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
            <div className="relative w-16 h-16 md:w-20 md:h-20 animate-float">
              <div className="absolute inset-0 glass-morphism flex items-center justify-center transform hover:scale-105 transition-transform group">
                <Mail className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:text-primary/80 transition-colors animate-[spin_3s_linear_infinite]" />
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-colors"></div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Spiral Society
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-[300px] mx-auto">
              Join the conversation, share your thoughts, connect with others.
            </p>
          </div>

          <div className="neo-blur rounded-2xl p-6 space-y-4">
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
                    borderRadius: '0.75rem',
                  },
                  anchor: { 
                    color: 'hsl(var(--primary))',
                    fontWeight: '500',
                  },
                  input: {
                    borderRadius: '0.75rem',
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
              options={{
                onError: (error) => {
                  setError(error.message);
                  console.error("Auth error:", error);
                }
              }}
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