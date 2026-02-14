import { NextRequest, NextResponse } from "next/server";
import {
  buildBookingResultUrl,
  extractEasebuzzCallbackData,
  resolveEasebuzzCallbackFlow,
  retrieveEasebuzzTransaction,
  verifyEasebuzzCallbackHash,
} from "@/lib/payments/easebuzz/service";
import {
  getPaymentCorsHeaders,
  parseCallbackBodyFromRaw,
} from "@/lib/payments/http";
import { getLogger } from "@/lib/logger";
import {
  applyCallbackBusinessStatus,
  logCallbackPaymentRequest,
} from "@/lib/payments/service";

const logger = getLogger("api-payments-easebuzz-callback");

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getPaymentCorsHeaders(request) });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldReturnJson(request: NextRequest) {
  if (request.nextUrl.searchParams.get("format") === "json") {
    return true;
  }

  const accept = (request.headers.get("accept") || "").toLowerCase();
  if (accept.includes("text/html")) {
    return false;
  }
  if (accept.includes("application/json")) {
    return true;
  }

  const fetchMode = request.headers.get("sec-fetch-mode") || "";
  if (fetchMode.toLowerCase() === "navigate") {
    return false;
  }

  return false;
}

export async function POST(request: NextRequest) {
  const corsHeaders = getPaymentCorsHeaders(request);
  const returnJson = shouldReturnJson(request);
  const contentType = request.headers.get("content-type") || "";
  const rawBody = await request.text();
  let parseError: string | null = null;
  let body: Record<string, string> = {};

  const hasBody = rawBody.trim().length > 0;
  if (hasBody) {
    try {
      body = parseCallbackBodyFromRaw(rawBody, contentType);
    } catch (error) {
      parseError =
        error instanceof Error
          ? error.message
          : "Unable to parse callback body";
    }
  }

  const data = extractEasebuzzCallbackData(body);
  const hashVerification = verifyEasebuzzCallbackHash(data);
  const callbackError = !hasBody ? "Callback body is empty" : parseError;

  try {
    await logCallbackPaymentRequest({
      transactionId: data.udf4 || data.txnid || null,
      easebuzzTxnId: data.txnid || null,
      easebuzzUrl: request.nextUrl.pathname,
      requestPayload: null,
      responsePayload: {
        callback: body, // Raw complete body
        hashVerification,
      },
      httpStatus: callbackError ? 400 : 200,
      easebuzzStatus: data.status,
      errorMessage: callbackError,
    });
  } catch (error) {
    logger.error("Failed to log Easebuzz callback payload", {
      message: error instanceof Error ? error.message : "Unknown error",
      transactionId: data.txnid || null,
    });
  }

  if (!hasBody) {
    if (!returnJson) {
      const redirectUrl = buildBookingResultUrl({
        flow: "failure",
        callbackStatus: data.status || "invalid",
        transactionId: data.udf4 || data.txnid || null,
        registrationId: data.udf1 || null,
        message: "Callback body is empty",
      });
      return NextResponse.redirect(redirectUrl, {
        status: 303,
        headers: corsHeaders,
      });
    }

    return NextResponse.json(
      {
        error: "Callback body is empty",
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }

  if (parseError) {
    if (!returnJson) {
      const redirectUrl = buildBookingResultUrl({
        flow: "failure",
        callbackStatus: data.status || "invalid",
        transactionId: data.udf4 || data.txnid || null,
        registrationId: data.udf1 || null,
        message: "Invalid callback body",
      });
      return NextResponse.redirect(redirectUrl, {
        status: 303,
        headers: corsHeaders,
      });
    }

    return NextResponse.json(
      {
        error: "Invalid callback body",
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }

  if (!hashVerification.valid) {
    if (!returnJson) {
      const redirectUrl = buildBookingResultUrl({
        flow: "failure",
        callbackStatus: data.status || "invalid",
        transactionId: data.udf4 || data.txnid || null,
        registrationId: data.udf1 || null,
        message: "Invalid callback hash",
      });
      return NextResponse.redirect(redirectUrl, {
        status: 303,
        headers: corsHeaders,
      });
    }

    return NextResponse.json(
      {
        error: "Invalid callback hash",
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }

  let effectiveData = data;
  let flow = resolveEasebuzzCallbackFlow(effectiveData.status);

  if (flow === "pending") {
    for (let attempt = 1; attempt <= 5; attempt++) {
      await sleep(1000);
      try {
        const retrieveResult = await retrieveEasebuzzTransaction({
          txnid: effectiveData.txnid,
        });
        const retrievedData = extractEasebuzzCallbackData(
          retrieveResult.payload,
        );
        const retrievedHashCheck = verifyEasebuzzCallbackHash(retrievedData);

        await logCallbackPaymentRequest({
          transactionId: effectiveData.udf4 || effectiveData.txnid || null,
          easebuzzTxnId: effectiveData.txnid || null,
          easebuzzUrl: retrieveResult.endpoint,
          requestPayload: retrieveResult.requestPayload,
          responsePayload: {
            callback: retrievedData,
            hashVerification: retrievedHashCheck,
            attempt,
          },
          httpStatus: retrieveResult.status,
          easebuzzStatus: retrievedData.status,
          errorMessage: retrieveResult.ok
            ? null
            : "Easebuzz retrieve API failed",
        });

        const retrievedFlow = resolveEasebuzzCallbackFlow(retrievedData.status);
        effectiveData = retrievedData;
        flow = retrievedFlow;
        if (retrievedFlow === "success" || retrievedFlow === "failure") {
          break;
        }
      } catch (error) {
        logger.warn("Pending flow retrieve attempt failed", {
          message: error instanceof Error ? error.message : "Unknown error",
          attempt,
          txnid: effectiveData.txnid,
        });
      }
    }
  }

  if (flow === "unknown") {
    if (!returnJson) {
      const redirectUrl = buildBookingResultUrl({
        flow: "failure",
        callbackStatus: effectiveData.status || "unknown",
        transactionId: effectiveData.udf4 || effectiveData.txnid || null,
        registrationId: effectiveData.udf1 || null,
        message: "Unsupported callback status",
      });
      return NextResponse.redirect(redirectUrl, {
        status: 303,
        headers: corsHeaders,
      });
    }

    return NextResponse.json(
      {
        error: "Unsupported callback status",
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }

  await applyCallbackBusinessStatus({
    transactionId: effectiveData.udf4 || effectiveData.txnid || null,
    easebuzzTxnId: effectiveData.txnid || null,
    registrationId: effectiveData.udf1 || null,
    flow,
    callbackStatus: effectiveData.status,
    gatewayMessage: effectiveData.errorMessage || effectiveData.error || null,
    paymentMode: effectiveData.mode || null,
  });

  if (!returnJson) {
    const redirectUrl = buildBookingResultUrl({
      flow,
      callbackStatus: effectiveData.status || undefined,
      transactionId: effectiveData.udf4 || effectiveData.txnid || null,
      registrationId: effectiveData.udf1 || null,
      message: effectiveData.errorMessage || effectiveData.error || null,
    });
    return NextResponse.redirect(redirectUrl, {
      status: 303,
      headers: corsHeaders,
    });
  }

  return NextResponse.json(
    {
      ok: true,
      received: true,
      status: effectiveData.status || null,
      flow,
    },
    {
      status: 200,
      headers: corsHeaders,
    },
  );
}
