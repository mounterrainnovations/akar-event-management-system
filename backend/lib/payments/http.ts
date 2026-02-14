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

function toStringRecord(body: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      value === null || value === undefined ? "" : String(value),
    ]),
  );
}

export function parseCallbackBodyFromRaw(
  rawBody: string,
  contentType?: string,
): Record<string, string> {
  const normalizedRawBody = rawBody.trim();
  if (!normalizedRawBody) {
    return {};
  }

  const normalizedContentType = (contentType || "").toLowerCase();
  if (normalizedContentType.includes("application/json")) {
    const parsed = JSON.parse(normalizedRawBody) as Record<string, unknown>;
    return toStringRecord(parsed);
  }

  if (normalizedContentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(normalizedRawBody).entries());
  }

  try {
    const parsed = JSON.parse(normalizedRawBody) as Record<string, unknown>;
    return toStringRecord(parsed);
  } catch {
    return Object.fromEntries(new URLSearchParams(normalizedRawBody).entries());
  }
}

export async function parseCallbackBody(request: NextRequest) {
  return parseCallbackBodyFromRaw(
    await request.text(),
    request.headers.get("content-type") || "",
  );
}

export function parseJsonBodyFromRaw<T>(rawBody: string): T {
  const normalizedRawBody = rawBody.trim();
  if (!normalizedRawBody) {
    throw new Error("Request body is empty");
  }

  try {
    return JSON.parse(normalizedRawBody) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}
