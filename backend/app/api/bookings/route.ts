import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import {
  createBookingForUser,
  listBookingsForUser,
  parseInitiateBookingInput,
  parsePaginationParams,
} from "@/lib/bookings/service";
import {
  parseJsonRequestBody,
  resolveBookingUserId,
} from "@/lib/bookings/http";

const logger = getLogger("api-bookings");

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveBookingUserId(
      request,
      request.nextUrl.searchParams.get("user_id") ||
        request.nextUrl.searchParams.get("userId"),
    );
    if (!auth.ok) {
      return auth.response;
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
      page: pagination.page,
      limit: pagination.limit,
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
    logger.error("Failed to list bookings", {
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

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonRequestBody<Record<string, unknown>>(request);
    const auth = await resolveBookingUserId(
      request,
      body.user_id || body.userId,
    );
    if (!auth.ok) {
      return auth.response;
    }

    // AI.md explicitly asked to log the exact initiate payload at this stage.
    console.log("[BOOKING_INITIATE_BODY]", body);

    let input: ReturnType<typeof parseInitiateBookingInput>;
    try {
      input = parseInitiateBookingInput(body);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Invalid request body",
        },
        {
          status: 400,
        },
      );
    }

    const result = await createBookingForUser({
      userId: auth.userId,
      input,
    });

    return NextResponse.json(
      {
        ok: true,
        booking: result.booking,
        pricing: result.pricing,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to initiate booking", { message });

    const status =
      message.includes("required") ||
      message.includes("must be") ||
      message.includes("not found") ||
      message.includes("invalid") ||
      message.includes("active") ||
      message.includes("expired") ||
      message.includes("exceeds") ||
      message.includes("already exists")
        ? 400
        : 500;

    return NextResponse.json(
      {
        error:
          status === 400 ? message : "Unable to initiate booking at this time",
      },
      {
        status,
      },
    );
  }
}
