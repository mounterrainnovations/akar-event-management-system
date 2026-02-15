import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { resolvePaymentRouteAccess } from "@/lib/payments/auth";
import {
  assertUuid,
  listPaymentsForEvent,
  parsePaymentListPagination,
} from "@/lib/payments/read-service";

const logger = getLogger("api-payments-event-list");

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await resolvePaymentRouteAccess(request);
    if (!auth.ok) {
      return auth.response;
    }

    const { eventId: rawEventId } = await context.params;
    let eventId: string;
    try {
      eventId = assertUuid(rawEventId, "eventId");
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Invalid eventId",
        },
        {
          status: 400,
        },
      );
    }

    let pagination: ReturnType<typeof parsePaymentListPagination>;
    try {
      pagination = parsePaymentListPagination(request.nextUrl.searchParams);
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

    const data = await listPaymentsForEvent({
      eventId,
      ...pagination,
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
    logger.error("Failed to list event payments", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Unable to list event payments",
      },
      {
        status: 500,
      },
    );
  }
}
