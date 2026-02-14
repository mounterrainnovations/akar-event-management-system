import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import {
  listBookingsForUser,
  parsePaginationParams,
} from "@/lib/bookings/service";
import { resolveBookingUserId } from "@/lib/bookings/http";

const logger = getLogger("api-bookings-event");

type Params = {
  params: Promise<{
    eventId: string;
  }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(request: NextRequest, context: Params) {
  try {
    const auth = await resolveBookingUserId(
      request,
      request.nextUrl.searchParams.get("user_id") ||
        request.nextUrl.searchParams.get("userId"),
    );
    if (!auth.ok) {
      return auth.response;
    }

    const { eventId } = await context.params;
    if (!isUuid(eventId)) {
      return NextResponse.json(
        {
          error: "eventId must be a valid UUID",
        },
        {
          status: 400,
        },
      );
    }

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

    const data = await listBookingsForUser({
      userId: auth.userId,
      eventId,
      page: pagination.page,
      limit: pagination.limit,
    });

    return NextResponse.json(
      {
        ok: true,
        eventId,
        ...data,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    logger.error("Failed to list bookings by event", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Unable to load bookings",
      },
      {
        status: 500,
      },
    );
  }
}
