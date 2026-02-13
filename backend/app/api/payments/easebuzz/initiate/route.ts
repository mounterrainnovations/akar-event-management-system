import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { validateSupabaseAccessToken } from "@/lib/payments/auth";
import {
  buildEasebuzzInitiatePayload,
  initiateEasebuzzTransaction,
  type InitiateEasebuzzPaymentInput,
} from "@/lib/payments/easebuzz/service";
import { getPaymentCorsHeaders } from "@/lib/payments/http";
import {
  createPendingPayment,
  logInitiatePaymentRequest,
  markPaymentInitiateFailed,
} from "@/lib/payments/service";

const logger = getLogger("api-payments-easebuzz-initiate");

type InitiatePaymentRequest = {
  amount: number;
  productInfo: string;
  firstName: string;
  email: string;
  phone: string;
  userId?: string;
  eventId?: string;
  registrationId: string;
};

function parseInitiateBody(
  body: InitiatePaymentRequest,
): InitiateEasebuzzPaymentInput {
  if (!Number.isFinite(body.amount) || body.amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  const productInfo = body.productInfo?.trim();
  const firstName = body.firstName?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const registrationId = body.registrationId?.trim();

  if (!productInfo) {
    throw new Error("productInfo is required");
  }
  if (!firstName) {
    throw new Error("firstName is required");
  }
  if (!email) {
    throw new Error("email is required");
  }
  if (!phone) {
    throw new Error("phone is required");
  }
  if (!registrationId) {
    throw new Error("registrationId is required");
  }

  return {
    amount: body.amount,
    productInfo,
    firstName,
    email,
    phone: body.phone?.trim(),
    userId: body.userId?.trim(),
    eventId: body.eventId?.trim(),
    registrationId,
  };
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getPaymentCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getPaymentCorsHeaders(request);
  let setTransactionId: string | null = null;

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

    //! Why this doesn't work ?
    // if (!request.body) {
    //   return NextResponse.json(
    //     {
    //       error: "No Body in Request",
    //     },
    //     {
    //       status: 400,
    //       headers: corsHeaders,
    //     },
    //   );
    // }

    const body = (await request.json()) as InitiatePaymentRequest;
    const input = parseInitiateBody(body);
    const userId = authValidation.userId || input.userId;
    if (!userId) {
      return NextResponse.json(
        {
          error: "userId is required when payment auth enforcement is disabled",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const { payload, transactionId, callbackUrls } =
      buildEasebuzzInitiatePayload({
        input: {
          ...input,
          userId,
        },
        requestOrigin: request.nextUrl.origin,
      });
    const registrationId = input.registrationId;
    setTransactionId = transactionId;
    if (!registrationId) {
      throw new Error("registrationId is required");
    }

    await createPendingPayment({
      transactionId,
      registrationId,
      userId,
      amount: input.amount,
      easebuzzTxnId: transactionId,
    });

    const gatewayResponse = await initiateEasebuzzTransaction(payload);
    const gatewayStatus =
      typeof gatewayResponse.data === "object" && gatewayResponse.data !== null
        ? String((gatewayResponse.data as { status?: string }).status || "")
        : null;

    await logInitiatePaymentRequest({
      transactionId,
      easebuzzUrl: gatewayResponse.endpoint,
      requestPayload: payload,
      responsePayload: gatewayResponse.data,
      httpStatus: gatewayResponse.status,
      easebuzzStatus: gatewayStatus,
      errorMessage: gatewayResponse.ok
        ? null
        : "Easebuzz initiate transaction failed",
    });

    if (!gatewayResponse.ok) {
      await markPaymentInitiateFailed({
        transactionId,
        message: "Easebuzz initiate transaction failed",
      });

      logger.error("Easebuzz initiate call failed", {
        status: gatewayResponse.status,
        transactionId,
      });

      return NextResponse.json(
        {
          error: "Easebuzz initiate transaction failed",
          transactionId,
          gateway: gatewayResponse.data,
        },
        {
          status: 502,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        transactionId,
        callbackUrls,
        gateway: gatewayResponse.data,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    logger.error("Failed to initiate Easebuzz transaction", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    if (setTransactionId && error instanceof Error) {
      try {
        await markPaymentInitiateFailed({
          transactionId: setTransactionId,
          message: error.message,
        });
      } catch (updateError) {
        logger.error(
          "Failed to mark payment row as failed after initiate error",
          {
            transactionId: setTransactionId,
            message:
              updateError instanceof Error
                ? updateError.message
                : "Unknown error",
          },
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to initiate transaction",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
