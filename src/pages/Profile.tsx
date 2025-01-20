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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, UserPlus, UserMinus, Trash2 } from "lucide-react";
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
  const [messages, setMessages] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    getProfile();
    getCurrentUser();
  }, [username]);

  async function getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUser(session.user.id);
      if (profile?.id) {
        fetchUserContent(profile.id);
      }
    }
  }

  async function fetchUserContent(userId: string) {
    // Fetch messages
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false });
    
    setMessages(messagesData || []);

    // Fetch posts
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    setPosts(postsData || []);
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
        
        // Fetch user content after profile is set
        fetchUserContent(profileData.id);
      }
    } catch (error: any) {
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
      toast({
        title: isFollowing ? "Unfollowed successfully" : "Followed successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update follow status",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", currentUser);

      if (error) throw error;

      setMessages(messages.filter(msg => msg.id !== messageId));
      toast({
        title: "Message deleted successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting message",
        description: error.message,
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", currentUser);

      if (error) throw error;

      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: "Post deleted successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting post",
        description: error.message,
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
      <div className="animate-fade-in space-y-6 p-4 max-w-4xl mx-auto">
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

              {currentUser && currentUser !== profile.id && (
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    className="transition-all duration-300 hover:scale-105"
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
                      <Button variant="outline" className="transition-all duration-300 hover:scale-105">
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

        {currentUser === profile.id && (
          <>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Your Posts</h3>
              {posts.map((post) => (
                <Card key={post.id} className="animate-fade-up">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <p className="text-sm">{post.content}</p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this post? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePost(post.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Your Messages</h3>
              {messages.map((message) => (
                <Card key={message.id} className="animate-fade-up">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <p className="text-sm">{message.content}</p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Message</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this message? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMessage(message.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}