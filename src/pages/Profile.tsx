import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, UserPlus, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MessageList } from "@/components/MessageList";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function Profile() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    getCurrentUser();
  }, []);

  async function getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUser(session.user.id);
      getProfile(session.user.id);
    } else {
      navigate('/');
    }
  }

  async function getProfile(userId: string) {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      
      if (profileData) {
        const { data: followersData } = await supabase
          .from("follows")
          .select("*")
          .eq("following_id", profileData.id);

        const { data: followingData } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", profileData.id);

        const { data: postsData } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false });

        setProfile(profileData);
        setFollowersCount(followersData?.length || 0);
        setFollowingCount(followingData?.length || 0);
        setPosts(postsData || []);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching profile",
        description: error.message,
      });
      navigate("/");
    }
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-4">
        <Card className="overflow-hidden backdrop-blur-sm bg-opacity-50">
          <CardHeader className="relative p-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2">
                <AvatarImage
                  src={
                    profile.avatar_url
                      ? `${
                          supabase.storage
                            .from("avatars")
                            .getPublicUrl(profile.avatar_url).data.publicUrl
                        }`
                      : undefined
                  }
                />
                <AvatarFallback className="bg-primary/10">
                  {profile.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <h2 className="text-2xl font-bold">{profile.username}</h2>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messages
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Messages</DialogTitle>
                    </DialogHeader>
                    <MessageList
                      recipientId={profile.id}
                      currentUserId={currentUser || ''}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{followersCount}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{followingCount}</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Posts</h3>
              {posts.map((post) => (
                <Card key={post.id} className="p-4">
                  <p>{post.content}</p>
                  {post.image_url && (
                    <img
                      src={supabase.storage.from("posts").getPublicUrl(post.image_url).data.publicUrl}
                      alt="Post"
                      className="mt-2 rounded-lg max-h-96 w-full object-cover"
                    />
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}