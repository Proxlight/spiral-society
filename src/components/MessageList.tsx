import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

interface MessageListProps {
  recipientId: string;
  currentUserId: string;
}

export function MessageList({ recipientId, currentUserId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("messages_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${currentUserId},receiver_id=eq.${recipientId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, recipientId]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        id,
        content,
        created_at,
        sender:profiles!messages_sender_id_fkey (
          username,
          avatar_url
        )
      `
      )
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .or(`sender_id.eq.${recipientId},receiver_id.eq.${recipientId}`)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching messages",
        description: error.message,
      });
    } else if (data) {
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        sender: Array.isArray(msg.sender) && msg.sender.length > 0 
          ? msg.sender[0]
          : { username: "Unknown", avatar_url: null }
      }));
      setMessages(formattedMessages);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase.from("messages").insert({
      content: newMessage.trim(),
      sender_id: currentUserId,
      receiver_id: recipientId,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error.message,
      });
    } else {
      setNewMessage("");
      toast({
        title: "Message sent successfully",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("sender_id", currentUserId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting message",
        description: error.message,
      });
    } else {
      toast({
        title: "Message deleted successfully",
      });
      fetchMessages();
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${
              message.sender.username === currentUserId
                ? "flex-row-reverse"
                : "flex-row"
            } animate-fade-up`}
          >
            <Avatar className="h-8 w-8 ring-1 ring-primary/20">
              <AvatarImage
                src={
                  message.sender.avatar_url
                    ? `${
                        supabase.storage
                          .from("avatars")
                          .getPublicUrl(message.sender.avatar_url).data.publicUrl
                      }`
                    : undefined
                }
              />
              <AvatarFallback>
                {message.sender.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div
              className={`group relative rounded-lg p-3 transition-all duration-300 hover:shadow-md ${
                message.sender.username === currentUserId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70">
                {formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true,
                })}
              </span>
              
              {message.sender.username === currentUserId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
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
                      <AlertDialogAction onClick={() => deleteMessage(message.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
        />
        <Button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="transition-all duration-300 hover:scale-105"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
