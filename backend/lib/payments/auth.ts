import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";
import { getLogger } from "@/lib/logger";

const logger = getLogger("payments-auth");

export type PaymentTokenValidationResult = {
  valid: boolean;
  userId: string | null;
  reason?: string;
};

export function shouldEnforcePaymentAuth() {
  return process.env.PAYMENT_ENFORCE_AUTH?.toLowerCase() === "true";
}

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

export async function validateSupabaseAccessToken(
  authorizationHeader: string | null,
): Promise<PaymentTokenValidationResult> {
  if (!shouldEnforcePaymentAuth()) {
    return {
      valid: true,
      userId: null,
      reason: "PAYMENT_ENFORCE_AUTH is disabled",
    };
  }

  const accessToken = parseBearerToken(authorizationHeader);
  if (!accessToken) {
    return {
      valid: false,
      userId: null,
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
  if (error || !data.user) {
    logger.warn("Payment token validation failed", {
      message: error?.message || "No user returned",
    });

    return {
      valid: false,
      userId: null,
      reason: "Invalid Supabase access token",
    };
  }

  return {
    valid: true,
    userId: data.user.id,
  };
}
