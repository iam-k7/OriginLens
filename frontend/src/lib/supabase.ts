import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// shortcut: session lives in supabase-js browser storage (no SSR cookies); add a proxy.ts + @supabase/ssr if you need server-rendered auth.
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
