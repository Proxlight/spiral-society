
import { createClient } from '@supabase/supabase-js';
import type { Database } from './client-types';

const SUPABASE_URL = "https://gqqxrxytgfdzrignopzt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcXhyeHl0Z2ZkenJpZ25vcHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MzY4NzUsImV4cCI6MjA1MjQxMjg3NX0.1rA2abF46-J28FIyGjG3md3Z1-LGjTYFVOfRkbg8Jhs";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
