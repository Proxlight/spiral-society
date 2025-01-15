import { Layout } from "@/components/Layout";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Feed = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Layout>
      <div className="py-4">
        <h1 className="text-2xl font-bold">Your Feed</h1>
        {/* We'll implement the feed content in the next step */}
      </div>
    </Layout>
  );
};

export default Feed;