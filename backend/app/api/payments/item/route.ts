import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { resolvePaymentRouteAccess } from "@/lib/payments/auth";
import { getSinglePayment } from "@/lib/payments/read-service";

const logger = getLogger("api-payments-item");

export async function GET(request: NextRequest) {
  try {
    const auth = await resolvePaymentRouteAccess(request);
    if (!auth.ok) {
      return auth.response;
    }

    const registrationId =
      request.nextUrl.searchParams.get("registrationId") ||
      request.nextUrl.searchParams.get("registration_id");
    const transactionId =
      request.nextUrl.searchParams.get("transactionId") ||
      request.nextUrl.searchParams.get("easebuzz_txnid") ||
      request.nextUrl.searchParams.get("txnid");

    let payment: Awaited<ReturnType<typeof getSinglePayment>>;
    try {
      payment = await getSinglePayment({ registrationId, transactionId });
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Invalid query params",
        },
        {
          status: 400,
        },
      );
    }

    if (!payment) {
      return NextResponse.json(
        {
          error: "Payment not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        item: payment,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    logger.error("Failed to fetch payment", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Unable to fetch payment",
      },
      {
        status: 500,
      },
    );
  }
}
