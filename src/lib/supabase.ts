import { createClient } from '@supabase/supabase-js';

// Use placeholders to prevent "supabaseUrl is required" crash if env vars are missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseUrl.includes('placeholder-project')
);

console.log('Supabase Configured:', isSupabaseConfigured);
if (!isSupabaseConfigured) {
  console.warn('Supabase is NOT configured correctly. Check your environment variables.');
}

const url = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const key = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'marketplace-multi-role' },
  },
});
