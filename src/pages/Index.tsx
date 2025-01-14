import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";

const Index = () => {
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
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="min-w-[200px]">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-w-[200px]">
            <Link to="/signup">Sign up</Link>
          </Button>
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