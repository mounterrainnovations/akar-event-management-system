import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { listAllBookings, parsePaginationParams } from "@/lib/bookings/service";

const logger = getLogger("api-bookings-all");

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(request: NextRequest) {
  try {
    let pagination: ReturnType<typeof parsePaginationParams>;
    try {
      pagination = parsePaginationParams(request.nextUrl.searchParams);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Invalid pagination",
        },
        {
          status: 400,
        },
      );
    }

    const eventId = request.nextUrl.searchParams.get("event_id") || request.nextUrl.searchParams.get("eventId");
    if (eventId && !isUuid(eventId)) {
      return NextResponse.json(
        {
          error: "event_id must be a valid UUID",
        },
        {
          status: 400,
        },
      );
    }

    const includeDeleted = request.nextUrl.searchParams.get("include_deleted") === "true";

    const data = await listAllBookings({
      page: pagination.page,
      limit: pagination.limit,
      eventId: eventId || undefined,
      includeDeleted,
    });

    return NextResponse.json(
      {
        ok: true,
        ...data,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    logger.error("Failed to list all bookings", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Unable to load all bookings",
      },
      {
        status: 500,
      },
    );
  }
}
