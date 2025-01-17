import { Layout } from "@/components/Layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Send, Heart, MessageCircle, Share2, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User } from "@supabase/supabase-js";

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function Hope() {
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchPosts();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching posts",
        description: error.message
      });
    } else {
      setPosts(data || []);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    setIsLoading(true);

    const { error } = await supabase
      .from('posts')
      .insert({ 
        content: newPost.trim(),
        user_id: user.id
      });

    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating post",
        description: error.message
      });
    } else {
      setNewPost("");
      fetchPosts();
      toast({
        title: "Post created successfully"
      });
    }
  };

  const handleEdit = async (postId: string) => {
    if (!editContent.trim() || !user) return;
    
    const { error } = await supabase
      .from('posts')
      .update({ content: editContent })
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating post",
        description: error.message
      });
    } else {
      setEditingPost(null);
      fetchPosts();
      toast({
        title: "Post updated successfully"
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting post",
        description: error.message
      });
    } else {
      setDeletePostId(null);
      fetchPosts();
      toast({
        title: "Post deleted successfully"
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm">
          <div className="space-y-4">
            <Textarea
              placeholder="Share your ideas and projects with the world..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button onClick={handlePost} disabled={isLoading || !user}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2" />
                )}
                Post
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-6 p-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow animate-fade-up"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {post.profiles.username?.[0] || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold">{post.profiles.username}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {user && post.user_id === user.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingPost(post.id);
                          setEditContent(post.content);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletePostId(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {editingPost === post.id ? (
                  <div className="mt-4 space-y-4">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditingPost(null)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => handleEdit(post.id)}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-foreground/90">{post.content}</p>
                )}

                <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm">
                    <Heart className="mr-1" />
                    0
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="mr-1" />
                    0
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your post.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletePostId && handleDelete(deletePostId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}