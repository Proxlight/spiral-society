import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LikeButtonProps {
  postId: string;
  userId: string;
  initialLikes: number;
}

export function LikeButton({ postId, userId, initialLikes }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const { toast } = useToast();

  useEffect(() => {
    checkIfLiked();
    subscribeToLikes();
  }, [postId, userId]);

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from("likes")
      .select()
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const subscribeToLikes = () => {
    const channel = supabase
      .channel("public:likes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes",
          filter: `post_id=eq.${postId}`,
        },
        async () => {
          const { count } = await supabase
            .from("likes")
            .select("*", { count: "exact" })
            .eq("post_id", postId);
          setLikesCount(count || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleLike = async () => {
    if (!userId) return;

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: userId });

        if (error) throw error;
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }

      toast({
        description: isLiked ? "Post unliked" : "Post liked",
        duration: 1500,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update like",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      className="group flex items-center gap-2 hover:text-red-500 transition-colors duration-200"
    >
      <Heart
        className={`h-4 w-4 transition-all duration-300 group-hover:scale-110 ${
          isLiked ? "fill-red-500 text-red-500" : ""
        }`}
      />
      <span className="text-sm font-medium">{likesCount}</span>
    </Button>
  );
}