import { NextRequest, NextResponse } from "next/server";
import { getPaymentCorsHeaders, parseCallbackBody } from "@/lib/payments/http";

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getPaymentCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getPaymentCorsHeaders(request);
  const body = await parseCallbackBody(request);

  // Placeholder for next phase: split callback body into success/failure scenarios.
  console.log("[Easebuzz Callback] Incoming payload:", body);

  return NextResponse.json(
    {
      ok: true,
      received: true,
    },
    {
      status: 200,
      headers: corsHeaders,
    },
  );
}
