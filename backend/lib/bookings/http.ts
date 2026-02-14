import { NextRequest, NextResponse } from "next/server";
import { validateSupabaseAccessToken } from "@/lib/payments/auth";

export type BookingRouteAuthResult =
  | {
      ok: true;
      userId: string;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getExplicitUserId(explicitUserId: unknown) {
  if (typeof explicitUserId !== "string" || !explicitUserId.trim()) {
    return null;
  }

  const trimmed = explicitUserId.trim();
  if (!isUuid(trimmed)) {
    throw new Error("user_id must be a valid UUID");
  }

  return trimmed;
}

export async function resolveBookingUserId(
  request: NextRequest,
  explicitUserId?: unknown,
): Promise<BookingRouteAuthResult> {
  const authValidation = await validateSupabaseAccessToken(
    request.headers.get("authorization"),
  );

  if (!authValidation.valid) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: authValidation.reason,
        },
        {
          status: 401,
        },
      ),
    };
  }

  let fallbackUserId: string | null = null;
  try {
    fallbackUserId = getExplicitUserId(explicitUserId);
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Invalid user_id",
        },
        {
          status: 400,
        },
      ),
    };
  }

  const resolvedUserId = authValidation.userId || fallbackUserId;
  if (!resolvedUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "user_id is required when PAYMENT_ENFORCE_AUTH is disabled",
        },
        {
          status: 400,
        },
      ),
    };
  }

  return {
    ok: true,
    userId: resolvedUserId,
  };
}

export async function parseJsonRequestBody<T>(request: NextRequest) {
  const rawBody = await request.text();
  if (!rawBody.trim()) {
    throw new Error("Request body is empty");
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}
