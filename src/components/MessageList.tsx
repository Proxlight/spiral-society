import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
    } else {
      setMessages(data || []);
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
            }`}
          >
            <Avatar className="h-8 w-8">
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
              className={`rounded-lg p-3 ${
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
        />
        <Button onClick={sendMessage} disabled={!newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}