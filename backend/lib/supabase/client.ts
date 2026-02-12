"use client";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./config";

let browserClient: ReturnType<typeof createClient> | undefined;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return browserClient;
}
