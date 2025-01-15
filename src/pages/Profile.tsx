import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Settings, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Profile {
  username: string;
  avatar_url: string | null;
}

export default function Profile() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching profile",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { session } } = await supabase.auth.getSession();
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', session?.user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
      
      getProfile();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error uploading avatar",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in space-y-6 p-4">
        <Card className="overflow-hidden backdrop-blur-sm bg-opacity-50">
          <CardHeader className="relative p-6">
            <div className="absolute right-6 top-6 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleDarkMode}
                className="rounded-full"
              >
                {darkMode ? "🌞" : "🌙"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => toast({ title: "Settings" })}
                className="rounded-full"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => toast({ title: "Share profile" })}
                className="rounded-full"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url ? `${supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl}` : undefined} />
                  <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <Label htmlFor="avatar" className="cursor-pointer absolute bottom-0 right-0 bg-primary text-white rounded-full p-2">
                  📷
                </Label>
                <Input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold">{profile?.username || 'Anonymous'}</h2>
              </div>
              
              <Button
                variant="default"
                onClick={handleSignOut}
                className="rounded-full"
              >
                Sign Out
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}