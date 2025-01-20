import { Layout } from "@/components/Layout";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { MessageCircle, Loader2, ImagePlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LikeButton } from "@/components/LikeButton";
import { CommentSection } from "@/components/CommentSection";
import { Link } from "react-router-dom";

interface Post {
  id: string;
  content: string;
  created_at: string;
  image_url: string | null;
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

  const handleLike = async (postId: string) => {
    const { error } = await supabase.from("likes").insert({
      post_id: postId,
      user_id: userId,
    });

    if (error && error.code !== "23505") {
      toast({
        variant: "destructive",
        title: "Error liking post",
        description: error.message,
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8 space-y-8">
        <Card>
          <CardContent className="pt-6">
            <Textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="mt-4 flex items-center gap-4">
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
                className="cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ImagePlus className="h-5 w-5" />
                {uploading ? "Uploading..." : "Add Image"}
              </Label>
              {imageUrl && (
                <span className="text-sm text-muted-foreground">
                  Image attached ✓
                </span>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={handleCreatePost}
              disabled={isLoading || (!newPost.trim() && !imageUrl)}
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Post
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="flex flex-row items-center space-x-4">
                <Link to={`/profile/${post.profiles.username}`}>
                  <Avatar>
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
                    <AvatarFallback>
                      {post.profiles.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex flex-col">
                  <Link
                    to={`/profile/${post.profiles.username}`}
                    className="font-semibold hover:underline"
                  >
                    {post.profiles.username}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap">{post.content}</p>
                {post.image_url && (
                  <img
                    src={`${
                      supabase.storage
                        .from("posts")
                        .getPublicUrl(post.image_url).data.publicUrl
                    }`}
                    alt="Post attachment"
                    className="rounded-lg max-h-96 w-full object-cover"
                  />
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <div className="flex gap-4 w-full">
                  {userId && (
                    <LikeButton
                      postId={post.id}
                      userId={userId}
                      initialLikes={post.likes.length}
                    />
                  )}
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {post.comments.length}
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