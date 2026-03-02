import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { getJourneyItemById } from "@/lib/journey/service";

const logger = getLogger("api-journey-id");
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

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const item = await getJourneyItemById(params.id);
    if (!item) {
      return NextResponse.json(
        { error: "Journey item not found" },
        { status: 404, headers: getCorsHeaders(request) },
      );
    }
    return NextResponse.json(item, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        ...getCorsHeaders(request),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch journey item", { error });
    return NextResponse.json(
      { error: "Failed to fetch journey item" },
      { status: 500, headers: getCorsHeaders(request) },
    );
  }
}
