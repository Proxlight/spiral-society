import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  _count?: {
    followers: number;
    following: number;
  };
}

export default function Profile() {
  const { username } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    getProfile();
    getCurrentUser();
  }, [username]);

  async function getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUser(session.user.id);
    }
  }

  async function getProfile() {
    try {
      if (!username) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
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

        const { data: isFollowingData } = await supabase
          .from("follows")
          .select("*")
          .eq("following_id", profileData.id)
          .eq("follower_id", currentUser)
          .single();

        setProfile(profileData);
        setFollowersCount(followersData?.length || 0);
        setFollowingCount(followingData?.length || 0);
        setIsFollowing(!!isFollowingData);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching profile",
        description: error.message,
      });
      navigate("/feed");
    }
  }

  const handleFollow = async () => {
    if (!profile || !currentUser) return;

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser)
          .eq("following_id", profile.id);
        setFollowersCount((prev) => prev - 1);
      } else {
        await supabase.from("follows").insert({
          follower_id: currentUser,
          following_id: profile.id,
        });
        setFollowersCount((prev) => prev + 1);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update follow status",
      });
    }
  };

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
      <div className="animate-fade-in space-y-6 p-4">
        <Card className="overflow-hidden backdrop-blur-sm bg-opacity-50">
          <CardHeader className="relative p-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
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
                <AvatarFallback>
                  {profile.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <h2 className="text-2xl font-bold">{profile.username}</h2>
              </div>

              {currentUser && currentUser !== profile.id && (
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Message {profile.username}</DialogTitle>
                      </DialogHeader>
                      <MessageList
                        recipientId={profile.id}
                        currentUserId={currentUser}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}