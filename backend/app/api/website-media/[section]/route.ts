import { NextRequest, NextResponse } from "next/server";
import { listPublicSectionMedia } from "@/lib/media/website-media-service";
import { isWebsiteSection } from "@/lib/media/website-sections";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api-website-media");
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://www.akarwomengroup.com",
  "https://akarwomengroup.com",
  "https://akar-event-management-system.vercel.app",
  "https://admin.akarwomengroup.com",
];

function parseBooleanQuery(value: string | null, defaultValue: boolean) {
  if (value === null) {
    return defaultValue;
  }
  const normalized = value.toLowerCase();
  if (normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "0") {
    return false;
  }
  return defaultValue;
}

function parseLimitQuery(value: string | null) {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function resolveAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed =
    allowedOrigins.includes(origin) ||
    /^https:\/\/akar-event-management-system.*\.vercel\.app$/.test(origin);
  return isAllowed ? origin : null;
}

// Helper to get CORS headers
function getCorsHeaders(request: NextRequest) {
  const origin = resolveAllowedOrigin(request);
  return {
    ...(origin && { "Access-Control-Allow-Origin": origin }),
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
  context: { params: Promise<{ section: string }> },
) {
  const { section } = await context.params;

  // Add CORS headers to error responses too
  if (!isWebsiteSection(section)) {
    return NextResponse.json(
      { error: "Invalid section" },
      {
        status: 400,
        headers: getCorsHeaders(request),
      },
    );
  }

  const onlyActive = parseBooleanQuery(
    request.nextUrl.searchParams.get("active"),
    true,
  );
  const limit = parseLimitQuery(request.nextUrl.searchParams.get("limit"));

  try {
    const payload = await listPublicSectionMedia({
      section,
      onlyActive,
      limit,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        ...getCorsHeaders(request),
      },
    });
  } catch (error) {
    logger.error("Failed to serve website media section", {
      section,
      onlyActive,
      limit,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Unable to fetch website media" },
      {
        status: 500,
        headers: getCorsHeaders(request),
      },
    );
  }
}
