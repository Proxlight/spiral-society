import { Layout } from "@/components/Layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'like' | 'comment';
  created_at: string;
  post: {
    content: string;
  };
  user: {
    username: string;
  };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    // For now, we'll fetch likes and comments on the user's posts
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const [likesResponse, commentsResponse] = await Promise.all([
      supabase
        .from('likes')
        .select(`
          id,
          created_at,
          posts (content),
          profiles (username)
        `)
        .eq('posts.user_id', userData.user.id)
        .order('created_at', { ascending: false }),
      
      supabase
        .from('comments')
        .select(`
          id,
          created_at,
          posts (content),
          profiles (username)
        `)
        .eq('posts.user_id', userData.user.id)
        .order('created_at', { ascending: false })
    ]);

    const notifications: Notification[] = [
      ...(likesResponse.data || []).map((like: any) => ({
        id: like.id,
        type: 'like' as const,
        created_at: like.created_at,
        post: like.posts,
        user: like.profiles
      })),
      ...(commentsResponse.data || []).map((comment: any) => ({
        id: comment.id,
        type: 'comment' as const,
        created_at: comment.created_at,
        post: comment.posts,
        user: comment.profiles
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setNotifications(notifications);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No notifications yet
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-card p-4 rounded-lg border hover:shadow-sm transition-shadow"
                >
                  <p className="text-sm">
                    <span className="font-semibold">{notification.user.username}</span>
                    {' '}
                    {notification.type === 'like' ? 'liked' : 'commented on'}
                    {' '}
                    your post: "{notification.post.content.substring(0, 50)}
                    {notification.post.content.length > 50 ? '...' : ''}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
}