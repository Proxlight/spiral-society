import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["search-posts", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes:likes (count)
        `)
        .ilike("content", `%${searchQuery}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: searchQuery.trim().length > 0
  });

  return (
    <Layout>
      <div className="space-y-4 py-4">
        <Input
          type="search"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))
          ) : !searchQuery.trim() ? (
            <p className="text-center text-muted-foreground py-8">
              Enter a search term to find posts
            </p>
          ) : posts?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No posts found matching "{searchQuery}"
            </p>
          ) : (
            posts?.map((post) => (
              <div key={post.id} className="flex flex-col space-y-2 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.profiles?.avatar_url || ""} />
                    <AvatarFallback>
                      {post.profiles?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">@{post.profiles?.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <p className="text-base">{post.content}</p>
                {post.image_url && (
                  <img 
                    src={post.image_url} 
                    alt="Post attachment" 
                    className="rounded-md max-h-96 object-cover w-full"
                  />
                )}
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{post.likes?.[0]?.count || 0} likes</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}