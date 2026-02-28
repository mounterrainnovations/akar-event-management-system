import { createClient } from "@supabase/supabase-js";

// Use the proxy route we set up in next.config.ts to bypass ISP blocks
// If window is undefined (SSR), we still need an absolute URL
const getAppUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return "http://localhost:3000"; // Fallback for local dev
};

const supabaseUrl = `${getAppUrl()}/supabase-api`;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
