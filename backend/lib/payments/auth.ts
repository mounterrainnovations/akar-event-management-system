import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";
import { getLogger } from "@/lib/logger";

const logger = getLogger("payments-auth");

export type PaymentTokenValidationResult = {
  valid: boolean;
  userId: string | null;
  reason?: string;
};

export type PaymentRouteAccessResult =
  | {
      ok: true;
      userId: string | null;
      authType: "bypass" | "cron" | "admin" | "supabase";
    }
  | {
      ok: false;
      response: NextResponse;
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

export function hasValidCronBearerToken(authorizationHeader: string | null) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }

  const bearerToken = parseBearerToken(authorizationHeader);
  if (!bearerToken) {
    return false;
  }

  return bearerToken === cronSecret;
}

export function isCronSecretConfigured() {
  return Boolean(process.env.CRON_SECRET?.trim());
}

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, entry) => {
      const separatorIndex = entry.indexOf("=");
      if (separatorIndex <= 0) {
        return accumulator;
      }
      let key = entry.slice(0, separatorIndex).trim();
      let value = entry.slice(separatorIndex + 1).trim();
      try {
        key = decodeURIComponent(key);
      } catch {
        // Ignore malformed cookie encoding and use raw key
      }
      try {
        value = decodeURIComponent(value);
      } catch {
        // Ignore malformed cookie encoding and use raw value
      }
      accumulator[key] = value;
      return accumulator;
    }, {});
}

export async function resolvePaymentRouteAccess(
  request: NextRequest,
): Promise<PaymentRouteAccessResult> {
  const authorizationHeader = request.headers.get("authorization");

  if (!shouldEnforcePaymentAuth()) {
    return {
      ok: true,
      userId: null,
      authType: "bypass",
    };
  }

  if (hasValidCronBearerToken(authorizationHeader)) {
    return {
      ok: true,
      userId: null,
      authType: "cron",
    };
  }

  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const sessionToken = cookies[SESSION_COOKIE_NAME];
  if (sessionToken) {
    const adminSession = verifySessionToken(sessionToken);
    if (adminSession) {
      return {
        ok: true,
        userId: adminSession.sub,
        authType: "admin",
      };
    }
  }

  const supabaseValidation =
    await validateSupabaseAccessToken(authorizationHeader);
  if (supabaseValidation.valid) {
    return {
      ok: true,
      userId: supabaseValidation.userId,
      authType: "supabase",
    };
  }

  logger.warn("Payment route auth failed", {
    reason: supabaseValidation.reason || "Unauthorized",
  });

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    ),
  };
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
