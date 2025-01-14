import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Bell, Edit2, Settings, Share2, User, Users } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Followed",
      description: isFollowing ? "You unfollowed this user" : "You are now following this user",
    });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <Layout>
      <div className="animate-fade-in space-y-6 p-4">
        <Card className="overflow-hidden backdrop-blur-sm bg-opacity-50">
          <CardHeader className="relative p-6">
            <div className="absolute right-6 top-6 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleDarkMode}
                className="rounded-full"
              >
                {darkMode ? "🌞" : "🌙"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => toast({ title: "Settings" })}
                className="rounded-full"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => toast({ title: "Share profile" })}
                className="rounded-full"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">Sarah Connor</h2>
                  <Badge variant="secondary">Verified</Badge>
                </div>
                <p className="text-muted-foreground">@sarahconnor</p>
              </div>
              
              <p className="max-w-md text-center text-muted-foreground">
                Building the future of AI. Trying to prevent Skynet. 
                Mother of John Connor. 🤖 #NoFate
              </p>
              
              <div className="flex gap-4">
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  onClick={handleFollow}
                  className="rounded-full"
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast({ title: "Message sent" })}
                  className="rounded-full"
                >
                  Message
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="text-2xl font-bold">1.2K</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">4.3K</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">825</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="backdrop-blur-sm bg-opacity-50">
            <CardHeader>
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm">Posted a new update</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-opacity-50">
            <CardHeader>
              <h3 className="text-lg font-semibold">Connections</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>U{i}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">User {i}</p>
                      <p className="text-xs text-muted-foreground">Connected recently</p>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}