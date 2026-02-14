import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";
import { getLogger } from "@/lib/logger";

const logger = getLogger("supabase-token-auth");

export type SupabaseBearerValidationResult =
  | {
      valid: true;
      userId: string;
    }
  | {
      valid: false;
      reason: string;
    };

function parseBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

export async function validateSupabaseBearerToken(
  authorizationHeader: string | null,
): Promise<SupabaseBearerValidationResult> {
  const accessToken = parseBearerToken(authorizationHeader);
  if (!accessToken) {
    return {
      valid: false,
      reason: "Missing Bearer token",
    };
  }

  const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user?.id) {
    logger.warn("Supabase bearer validation failed", {
      message: error?.message || "No user returned",
    });

    return {
      valid: false,
      reason: "Invalid Supabase access token",
    };
  }

  return {
    valid: true,
    userId: data.user.id,
  };
}
