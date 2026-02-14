import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { validateSupabaseAccessToken } from "@/lib/payments/auth";
import {
  extractEasebuzzCallbackData,
  resolveEasebuzzCallbackFlow,
  retrieveEasebuzzTransaction,
  verifyEasebuzzCallbackHash,
} from "@/lib/payments/easebuzz/service";
import {
  getPaymentCorsHeaders,
  parseJsonBodyFromRaw,
} from "@/lib/payments/http";
import {
  applyCallbackBusinessStatus,
  getRegistrationTransactionLookup,
  logCallbackPaymentRequest,
} from "@/lib/payments/service";

const logger = getLogger("api-payments-easebuzz-transaction");

type TransactionStatusRequest = {
  registrationId: string;
};

function parseRequestBody(body: TransactionStatusRequest) {
  const registrationId = body.registrationId?.trim();
  if (!registrationId) {
    throw new Error("registrationId is required");
  }

  return {
    registrationId,
  };
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getPaymentCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getPaymentCorsHeaders(request);

  try {
    const authValidation = await validateSupabaseAccessToken(
      request.headers.get("authorization"),
    );
    if (!authValidation.valid) {
      return NextResponse.json(
        {
          error: authValidation.reason || "Unauthorized",
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

    let input: ReturnType<typeof parseRequestBody>;
    try {
      input = parseRequestBody(body);
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
    let lookup: Awaited<ReturnType<typeof getRegistrationTransactionLookup>>;
    try {
      lookup = await getRegistrationTransactionLookup(input.registrationId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to resolve registration transaction";
      const status = message.includes("valid UUID") ? 400 : 404;
      return NextResponse.json(
        {
          error: message,
        },
        {
          status,
          headers: corsHeaders,
        },
      );
    }

    const retrieveResult = await retrieveEasebuzzTransaction({
      txnid: lookup.transactionId,
    });

    const callbackData = extractEasebuzzCallbackData(retrieveResult.payload);
    const hashVerification = verifyEasebuzzCallbackHash(callbackData);
    const flow = resolveEasebuzzCallbackFlow(callbackData.status);

    await logCallbackPaymentRequest({
      action: "transaction",
      transactionId: lookup.transactionId,
      easebuzzTxnId: lookup.transactionId,
      easebuzzUrl: retrieveResult.endpoint,
      requestPayload: retrieveResult.requestPayload,
      responsePayload: {
        callback: callbackData,
        hashVerification,
      },
      httpStatus: retrieveResult.status,
      easebuzzStatus: callbackData.status,
      errorMessage: retrieveResult.ok ? null : "Easebuzz retrieve API failed",
    });

    if (hashVerification.valid && flow !== "unknown") {
      await applyCallbackBusinessStatus({
        transactionId: lookup.transactionId,
        easebuzzTxnId: lookup.transactionId,
        registrationId: lookup.registrationId,
        flow,
        callbackStatus: callbackData.status,
        gatewayMessage: callbackData.errorMessage || callbackData.error || null,
        paymentMode: callbackData.mode || null,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        registrationId: lookup.registrationId,
        transactionId: lookup.transactionId,
        status: callbackData.status || null,
        flow,
        hashVerification,
        gateway: retrieveResult.payload,
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
