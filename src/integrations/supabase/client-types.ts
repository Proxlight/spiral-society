
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
          content: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
          content: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
          content?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          content: string;
          created_at: string;
          image_url: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          content: string;
          created_at?: string;
          image_url?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          content?: string;
          created_at?: string;
          image_url?: string | null;
          user_id?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
          bio: string | null;
          verified: boolean | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          bio?: string | null;
          verified?: boolean | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          bio?: string | null;
          verified?: boolean | null;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
    };
  };
}
