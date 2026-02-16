import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { resolvePaymentRouteAccess } from "@/lib/payments/auth";
import {
  assertUuid,
  listPaymentsForUser,
  parsePaymentListPagination,
} from "@/lib/payments/read-service";

const logger = getLogger("api-payments-user-list");

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await resolvePaymentRouteAccess(request);
    if (!auth.ok) {
      return auth.response;
    }

    const { userId: rawUserId } = await context.params;
    let userId: string;
    try {
      userId = assertUuid(rawUserId, "userId");
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Invalid userId",
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

    const data = await listPaymentsForUser({
      userId,
      ...pagination,
    });

    return NextResponse.json(
      {
        ok: true,
        userId,
        ...data,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    logger.error("Failed to list user payments", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Unable to list user payments",
      },
      {
        status: 500,
      },
    );
  }
}
