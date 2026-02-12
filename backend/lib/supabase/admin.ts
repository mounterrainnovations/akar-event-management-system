import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./config";
import { getLogger } from "@/lib/logger";

const logger = getLogger("supabase-admin");

export function createSupabaseAdminClient() {
  logger.debug("Creating Supabase admin client");
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
