import { NextRequest, NextResponse } from "next/server";
import {
  extractEasebuzzCallbackData,
  getMissingEasebuzzUdfKeys,
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

export async function POST(request: NextRequest) {
  const corsHeaders = getPaymentCorsHeaders(request);
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
  const missingUdfKeys = getMissingEasebuzzUdfKeys(body);
  const hashVerification = verifyEasebuzzCallbackHash(data);
  const callbackError = !hasBody
    ? "Callback body is empty"
    : parseError
      ? parseError
      : missingUdfKeys.length > 0
        ? `Missing required callback keys: ${missingUdfKeys.join(", ")}`
        : !hashVerification.valid
          ? hashVerification.reason || "hash_mismatch"
          : null;

  try {
    await logCallbackPaymentRequest({
      transactionId: data.txnid || null,
      easebuzzTxnId: data.txnid || null,
      easebuzzUrl: request.nextUrl.pathname,
      requestPayload: parseError
        ? {
            _raw_body: rawBody,
            _parse_error: parseError,
          }
        : hasBody
          ? body
          : {
              _raw_body: "",
              _error: "Callback body is empty",
            },
      responsePayload: {
        callback: data,
        missingUdfKeys,
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

  if (missingUdfKeys.length > 0) {
    return NextResponse.json(
      {
        error: `Missing required callback keys: ${missingUdfKeys.join(", ")}`,
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }

  if (!hashVerification.valid) {
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
          key: effectiveData.key,
          txnid: effectiveData.txnid,
          hash: effectiveData.hash,
        });
        const retrievedData = extractEasebuzzCallbackData(retrieveResult.payload);
        const retrievedHashCheck = verifyEasebuzzCallbackHash(retrievedData);

        await logCallbackPaymentRequest({
          transactionId: effectiveData.udf4 || effectiveData.txnid || null,
          easebuzzTxnId: effectiveData.txnid || null,
          easebuzzUrl: retrieveResult.endpoint,
          requestPayload: {
            key: effectiveData.key,
            txnid: effectiveData.txnid,
            hash: effectiveData.hash,
          },
          responsePayload: {
            callback: retrievedData,
            hashVerification: retrievedHashCheck,
            attempt,
          },
          httpStatus: retrieveResult.status,
          easebuzzStatus: retrievedData.status,
          errorMessage: retrieveResult.ok ? null : "Easebuzz retrieve API failed",
        });

        if (!retrievedHashCheck.valid) {
          continue;
        }

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
    eventId: effectiveData.udf2 || null,
    userId: effectiveData.udf3 || null,
    flow,
    callbackStatus: effectiveData.status,
    gatewayMessage: effectiveData.errorMessage || effectiveData.error || null,
    paymentMode: body.mode || null,
  });

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
