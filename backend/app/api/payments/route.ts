import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { resolvePaymentRouteAccess } from "@/lib/payments/auth";
import {
  listAllPayments,
  parsePaymentListPagination,
} from "@/lib/payments/read-service";

const logger = getLogger("api-payments-list");

export async function GET(request: NextRequest) {
  try {
    const auth = await resolvePaymentRouteAccess(request);
    if (!auth.ok) {
      return auth.response;
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

    const data = await listAllPayments(pagination);

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
    logger.error("Failed to list payments", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Unable to list payments",
      },
      {
        status: 500,
      },
    );
  }
}
