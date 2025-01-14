import { Layout } from "@/components/Layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Send, Heart, MessageCircle, Share2 } from "lucide-react";

interface Post {
  id: string;
  author: string;
  content: string;
  likes: number;
  comments: number;
  image?: string;
}

export default function Hope() {
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: "Sarah Chen",
      content: "Just launched my new AI project! Check it out: www.aiproject.com",
      likes: 42,
      comments: 12,
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475"
    },
    {
      id: "2",
      author: "Alex Rivera",
      content: "Looking for collaborators on a sustainable energy initiative. DM if interested!",
      likes: 28,
      comments: 8,
      image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e"
    }
  ]);

  const handlePost = () => {
    if (!newPost.trim()) return;
    
    const post: Post = {
      id: Date.now().toString(),
      author: "Current User",
      content: newPost,
      likes: 0,
      comments: 0
    };
    
    setPosts([post, ...posts]);
    setNewPost("");
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
              <Button onClick={handlePost}>
                <Send className="mr-2" />
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
                      {post.author[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">{post.author}</h3>
                      <p className="text-sm text-muted-foreground">Just now</p>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-foreground/90">{post.content}</p>

                {post.image && (
                  <img
                    src={post.image}
                    alt="Post attachment"
                    className="mt-4 rounded-lg w-full h-48 object-cover"
                  />
                )}

                <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm">
                    <Heart className="mr-1" />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="mr-1" />
                    {post.comments}
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
      </div>
    </Layout>
  );
}