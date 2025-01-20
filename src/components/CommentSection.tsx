import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
  userId: string;
}

export function CommentSection({ postId, userId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
    subscribeToComments();
  }, [postId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch comments",
      });
    } else {
      setComments(data || []);
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel("public:comments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !userId) return;

    setIsLoading(true);
    const { error } = await supabase.from("comments").insert({
      content: newComment.trim(),
      post_id: postId,
      user_id: userId,
    });

    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post comment",
      });
    } else {
      setNewComment("");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none transition-all duration-300 focus:ring-2 focus:ring-primary"
        />
        <Button
          onClick={handleSubmitComment}
          disabled={isLoading || !newComment.trim()}
          className="relative overflow-hidden transition-all duration-300 hover:scale-105"
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex gap-3 items-start border-b pb-4 last:border-0 animate-fade-up"
          >
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage
                src={
                  comment.profiles.avatar_url
                    ? `${
                        supabase.storage
                          .from("avatars")
                          .getPublicUrl(comment.profiles.avatar_url).data
                          .publicUrl
                      }`
                    : undefined
                }
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30">
                {comment.profiles.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 group">
              <div className="flex items-center gap-2">
                <span className="font-semibold hover:text-primary transition-colors duration-300">
                  {comment.profiles.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-sm mt-1 leading-relaxed transition-all duration-300 group-hover:translate-x-1">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}