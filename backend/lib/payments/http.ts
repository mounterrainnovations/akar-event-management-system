import { NextRequest } from "next/server";
import { getPaymentAllowedOrigins } from "@/lib/payments/easebuzz/config";

function resolveAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  return getPaymentAllowedOrigins().includes(origin) ? origin : null;
}

export function getPaymentCorsHeaders(request: NextRequest) {
  const origin = resolveAllowedOrigin(request);

  return {
    ...(origin && { "Access-Control-Allow-Origin": origin }),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...(origin && { "Access-Control-Allow-Credentials": "true" }),
    Vary: "Origin",
  };
}

export async function parseCallbackBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)]),
    );
  }

  const formData = await request.formData();
  const payload: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    payload[key] = typeof value === "string" ? value : value.name;
  }

  return payload;
}
