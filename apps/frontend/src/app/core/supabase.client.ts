import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────
// Supabase credentials
// Replace the two values below with your own Supabase project's URL and
// publishable (anon) key. The publishable key is safe to use in the browser.
// Never put the `service_role` / secret key here.
// ─────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://lvymkstqztdgkanqmhoh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Pmg3pMtsneMOh8XJaBTNsA_sdDeIXMi';

// ─────────────────────────────────────────────────────────────────────────
// Supabase client
// ─────────────────────────────────────────────────────────────────────────
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
);

export default supabase;
