import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { listJourneyItems } from "@/lib/journey/service";

const logger = getLogger("api-journey");
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://www.akarwomengroup.com",
  "https://akarwomengroup.com",
  "https://akar-event-management-system.vercel.app",
  "https://admin.akarwomengroup.com",
];

function resolveAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed =
    allowedOrigins.includes(origin) ||
    /^https:\/\/akar-event-management-system.*\.vercel\.app$/.test(origin);
  return isAllowed ? origin : null;
}

function getCorsHeaders(request: NextRequest) {
  const origin = resolveAllowedOrigin(request);
  return {
    ...(origin && { "Access-Control-Allow-Origin": origin }),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...(origin && { "Access-Control-Allow-Credentials": "true" }),
    Vary: "Origin",
  };
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  try {
    const items = await listJourneyItems();
    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        ...getCorsHeaders(request),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch journey items", { error });
    return NextResponse.json(
      { error: "Failed to fetch journey items" },
      { status: 500, headers: getCorsHeaders(request) },
    );
  }
}
