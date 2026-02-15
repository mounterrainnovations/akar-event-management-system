import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { resolvePaymentRouteAccess } from "@/lib/payments/auth";
import {
  getPaymentCorsHeaders,
  parseJsonBodyFromRaw,
} from "@/lib/payments/http";
import { parseTransactionRouteBody } from "@/lib/payments/read-service";
import { syncRegistrationTransactions } from "@/lib/payments/transaction-status";

const logger = getLogger("api-payments-easebuzz-transaction");

type TransactionStatusRequest = {
  registrationId?: string;
  registrationIds?: string[];
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getPaymentCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getPaymentCorsHeaders(request);

  try {
    const auth = await resolvePaymentRouteAccess(request);
    if (!auth.ok) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    const rawBody = await request.text();
    let body: TransactionStatusRequest;
    try {
      body = parseJsonBodyFromRaw<TransactionStatusRequest>(rawBody);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Invalid request body",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    let input: ReturnType<typeof parseTransactionRouteBody>;
    try {
      input = parseTransactionRouteBody(body);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Invalid request body",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }
    const results = await syncRegistrationTransactions(input.registrationIds);
    const successful = results.filter((item) => item.ok);
    const failed = results.filter((item) => !item.ok);

    return NextResponse.json(
      {
        ok: failed.length === 0,
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        items: results,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    logger.error("Failed to retrieve Easebuzz transaction status", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve transaction status",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
