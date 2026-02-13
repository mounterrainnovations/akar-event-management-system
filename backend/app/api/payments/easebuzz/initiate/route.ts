import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { validateSupabaseAccessToken } from "@/lib/payments/auth";
import {
  buildEasebuzzInitiatePayload,
  initiateEasebuzzTransaction,
  type InitiateEasebuzzPaymentInput,
} from "@/lib/payments/easebuzz/service";
import { getPaymentCorsHeaders } from "@/lib/payments/http";

const logger = getLogger("api-payments-easebuzz-initiate");

type InitiatePaymentRequest = {
  amount: number;
  productInfo: string;
  firstName: string;
  email: string;
  phone: string;
  eventId?: string;
  registrationId?: string;
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

  return {
    amount: body.amount,
    productInfo,
    firstName,
    email,
    phone: body.phone?.trim(),
    eventId: body.eventId?.trim(),
    registrationId: body.registrationId?.trim(),
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

    const body = (await request.json()) as InitiatePaymentRequest;
    const input = parseInitiateBody(body);

    const { payload, paymentReference, callbackUrls } =
      buildEasebuzzInitiatePayload({
        input: {
          ...input,
          userId: authValidation.userId || undefined,
        },
        requestOrigin: request.nextUrl.origin,
      });

    const gatewayResponse = await initiateEasebuzzTransaction(payload);
    if (!gatewayResponse.ok) {
      logger.error("Easebuzz initiate call failed", {
        status: gatewayResponse.status,
        paymentReference,
      });

      return NextResponse.json(
        {
          error: "Easebuzz initiate transaction failed",
          paymentReference,
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
        paymentReference,
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
