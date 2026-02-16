import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { validateSupabaseAccessToken } from "@/lib/payments/auth";
import { type InitiateEasebuzzPaymentInput } from "@/lib/payments/easebuzz/service";
import {
  getPaymentCorsHeaders,
  parseJsonBodyFromRaw,
} from "@/lib/payments/http";
import { initiatePaymentFlow } from "@/lib/payments/service";

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

type ParsedInitiateInput = Omit<
  InitiateEasebuzzPaymentInput,
  "registrationId"
> & {
  registrationId: string;
};

function parseInitiateBody(body: InitiatePaymentRequest): ParsedInitiateInput {
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
  // Validate phone: exactly 10 digits
  if (!/^\d{10}$/.test(phone)) {
    throw new Error("phone must be exactly 10 digits");
  }
  if (!registrationId) {
    throw new Error("registrationId is required");
  }

  return {
    amount: body.amount,
    productInfo,
    firstName,
    email,
    phone,
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
    let body: InitiatePaymentRequest;
    try {
      body = parseJsonBodyFromRaw<InitiatePaymentRequest>(rawBody);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid request body",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    let input: ParsedInitiateInput;
    try {
      input = parseInitiateBody(body);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid request body",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

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

    const paymentResult = await initiatePaymentFlow({
      input: {
        ...input,
        userId,
      },
      requestOrigin: request.nextUrl.origin,
    });

    if (!paymentResult.ok) {
      return NextResponse.json(
        {
          error: paymentResult.error,
          transactionId: paymentResult.transactionId,
          gateway: paymentResult.gateway,
        },
        {
          status: paymentResult.status,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        paymentUrl: paymentResult.paymentUrl,
        transactionId: paymentResult.transactionId,
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
