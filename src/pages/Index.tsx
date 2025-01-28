import { Layout } from "@/components/Layout";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

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
            {/* Spiral Society Logo */}
            <div className="relative w-16 h-16 md:w-20 md:h-20 animate-float">
              <div className="absolute inset-0 glass-morphism flex items-center justify-center transform hover:scale-105 transition-transform duration-300 group rounded-2xl">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:text-primary/80 transition-colors animate-[pulse_3s_linear_infinite]" />
                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl group-hover:bg-primary/20 transition-colors"></div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Spiral Society
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-[300px] mx-auto">
              Join the conversation, share your thoughts, connect with others.
            </p>
          </div>

          <div className="neo-blur rounded-2xl p-6 space-y-4 backdrop-blur-xl">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Auth
              supabaseClient={supabase}
              onError={(error) => {
                setError(error.message);
                console.error("Auth error:", error);
              }}
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: { 
                    background: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  },
                  anchor: { 
                    color: 'hsl(var(--primary))',
                    fontWeight: '500',
                    textDecoration: 'none',
                  },
                  input: {
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                  },
                  label: {
                    color: 'hsl(var(--foreground))',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  },
                },
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(var(--primary))',
                      brandAccent: 'hsl(var(--primary))',
                      inputBackground: 'transparent',
                      inputText: 'hsl(var(--foreground))',
                      inputBorder: 'hsl(var(--border))',
                      inputBorderFocus: 'hsl(var(--ring))',
                      inputBorderHover: 'hsl(var(--ring))',
                    },
                  },
                },
              }}
              providers={[]}
              redirectTo={window.location.origin + "/feed"}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email',
                    password_label: 'Password',
                  },
                },
              }}
              view="sign_in"
              showLinks={true}
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