import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { verifyEasebuzzCallbackHash } from "@/lib/payments/easebuzz/service";
import { parseCallbackBody, getPaymentCorsHeaders } from "@/lib/payments/http";
import { processEasebuzzCallback } from "@/lib/payments/service";

const logger = getLogger("api-payments-easebuzz-callback");

export async function handleEasebuzzCallback(request: NextRequest, outcome: "success" | "failure") {
  const corsHeaders = getPaymentCorsHeaders(request);

  try {
    const payload = await parseCallbackBody(request);

    if (!verifyEasebuzzCallbackHash(payload)) {
      logger.warn("Easebuzz callback hash verification failed", {
        outcome,
        txnid: payload.txnid || null,
      });

      return NextResponse.json(
        {
          error: "Invalid callback hash",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    const result = await processEasebuzzCallback({
      outcome,
      payload,
      queryPaymentRef: request.nextUrl.searchParams.get("paymentRef"),
      queryRegistrationId: request.nextUrl.searchParams.get("registrationId"),
    });

    return NextResponse.json(
      {
        ok: true,
        paymentReference: result.paymentReference,
        registrationId: result.registrationId,
        status: result.status,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    logger.error("Failed to process Easebuzz callback", {
      outcome,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to process callback",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
