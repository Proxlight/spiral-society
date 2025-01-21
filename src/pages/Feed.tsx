import { Layout } from "@/components/Layout";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { MessageCircle, Loader2, ImagePlus, MoreHorizontal, Pencil, Trash2, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LikeButton } from "@/components/LikeButton";
import { CommentSection } from "@/components/CommentSection";
import { Link } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  content: string;
  created_at: string;
  image_url: string | null;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
  likes: { user_id: string }[];
  comments: { id: string }[];
}

const Feed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      } else {
        setUserId(session.user.id);
        fetchPosts();
        subscribeToChanges();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (
          username,
          avatar_url
        ),
        likes (user_id),
        comments (id)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching posts",
        description: error.message,
      });
    } else {
      setPosts(data || []);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel("public:posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setImageUrl(filePath);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error uploading image",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !imageUrl) return;

    setIsLoading(true);
    const { error } = await supabase.from("posts").insert({
      content: newPost.trim(),
      user_id: userId,
      image_url: imageUrl,
    });

    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating post",
        description: error.message,
      });
    } else {
      setNewPost("");
      setImageUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Post created successfully",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        description: "Post deleted successfully",
        duration: 1500,
      });
      
      fetchPosts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete post",
      });
    }
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ content: newContent })
        .eq("id", postId)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        description: "Post updated successfully",
        duration: 1500,
      });
      
      fetchPosts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update post",
      });
    }
  };

  const handleShare = async (post: Post) => {
    try {
      await navigator.share({
        title: `Post by ${post.profiles.username}`,
        text: post.content,
        url: window.location.href,
      });
    } catch (error) {
      toast({
        description: "Your browser doesn't support sharing",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-4 space-y-6 px-4 md:px-0">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              {userId && (
                <Avatar className="w-12 h-12">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-primary/10">?</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 space-y-4">
                <Textarea
                  placeholder="What's happening?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] resize-none transition-all duration-300 focus:ring-2 focus:ring-primary border-none bg-transparent text-lg"
                />
                <div className="flex items-center justify-between">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    disabled={uploading}
                    ref={fileInputRef}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label
                    htmlFor="image-upload"
                    className="cursor-pointer flex items-center gap-2 text-primary hover:text-primary/80 transition-colors duration-300"
                  >
                    <ImagePlus className="h-5 w-5" />
                    {uploading ? "Uploading..." : "Add Image"}
                  </Label>
                  <Button
                    onClick={handleCreatePost}
                    disabled={isLoading || (!newPost.trim() && !imageUrl)}
                    className="rounded-full px-6"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Post
                  </Button>
                </div>
                {imageUrl && (
                  <p className="text-sm text-muted-foreground animate-fade-in">
                    Image attached ✓
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {posts.map((post) => (
            <Card 
              key={post.id}
              className="group hover:shadow-lg transition-all duration-300 animate-fade-up border-none bg-white/80 backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-start space-y-0 gap-4">
                <Link 
                  to={`/profile/${post.profiles.username}`}
                  className="transition-transform duration-300 hover:scale-105"
                >
                  <Avatar className="w-12 h-12 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300">
                    <AvatarImage
                      src={
                        post.profiles.avatar_url
                          ? `${
                              supabase.storage
                                .from("avatars")
                                .getPublicUrl(post.profiles.avatar_url).data
                                .publicUrl
                            }`
                          : undefined
                      }
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30">
                      {post.profiles.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/profile/${post.profiles.username}`}
                      className="font-semibold hover:text-primary transition-colors duration-300 flex items-center gap-2"
                    >
                      {post.profiles.username}
                      <span className="text-sm text-muted-foreground font-normal">
                        · {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </Link>
                    {userId === post.user_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onClick={() => {
                              const newContent = prompt("Edit your post:", post.content);
                              if (newContent && newContent !== post.content) {
                                handleEditPost(post.id, newContent);
                              }
                            }}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
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
                                <AlertDialogAction
                                  onClick={() => handleDeletePost(post.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <p className="text-base leading-relaxed">{post.content}</p>
                  {post.image_url && (
                    <img
                      src={`${
                        supabase.storage
                          .from("posts")
                          .getPublicUrl(post.image_url).data.publicUrl
                      }`}
                      alt="Post attachment"
                      className="rounded-xl max-h-96 w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                  )}
                </div>
              </CardHeader>
              <CardFooter className="flex flex-col gap-4 pt-0">
                <div className="flex gap-4 w-full border-t pt-4">
                  {userId && (
                    <LikeButton
                      postId={post.id}
                      userId={userId}
                      initialLikes={post.likes.length}
                    />
                  )}
                  <Button variant="ghost" size="sm" className="hover:text-primary transition-colors duration-300">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {post.comments.length}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(post)}
                    className="hover:text-primary transition-colors duration-300"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
                {userId && (
                  <CommentSection postId={post.id} userId={userId} />
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Feed;