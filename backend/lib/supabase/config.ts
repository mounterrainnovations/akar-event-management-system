import { getLogger } from "@/lib/logger";

const logger = getLogger("supabase-config");

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    logger.error("Missing required environment variable", { name });
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export function getSupabaseUrl() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}
