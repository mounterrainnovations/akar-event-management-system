import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import {
  cancelBookingForUser,
  getBookingByIdForUser,
} from "@/lib/bookings/service";
import { resolveBookingUserId } from "@/lib/bookings/http";

const logger = getLogger("api-booking-by-id");

type Params = {
  params: Promise<{
    bookingId: string;
  }>;
};

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

    const { bookingId } = await context.params;
    const booking = await getBookingByIdForUser({
      userId: auth.userId,
      bookingId,
    });

    if (!booking) {
      return NextResponse.json(
        {
          error: "Booking not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        booking,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("valid UUID") ? 400 : 500;

    if (status === 500) {
      logger.error("Failed to load booking by id", { message });
    }

    return NextResponse.json(
      {
        error: status === 400 ? message : "Unable to load booking",
      },
      {
        status,
      },
    );
  }
}

export async function DELETE(request: NextRequest, context: Params) {
  try {
    const auth = await resolveBookingUserId(
      request,
      request.nextUrl.searchParams.get("user_id") ||
        request.nextUrl.searchParams.get("userId"),
    );
    if (!auth.ok) {
      return auth.response;
    }

    const { bookingId } = await context.params;
    const booking = await cancelBookingForUser({
      userId: auth.userId,
      bookingId,
    });

    return NextResponse.json(
      {
        ok: true,
        booking,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message.includes("valid UUID") ||
      message.includes("not found") ||
      message.includes("already cancelled")
        ? 400
        : 500;

    if (status === 500) {
      logger.error("Failed to cancel booking", { message });
    }

    return NextResponse.json(
      {
        error: status === 400 ? message : "Unable to cancel booking",
      },
      {
        status,
      },
    );
  }
}
