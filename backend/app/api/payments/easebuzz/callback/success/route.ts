import { NextRequest, NextResponse } from "next/server";
import { handleEasebuzzCallback } from "@/lib/payments/callback-handler";
import { getPaymentCorsHeaders } from "@/lib/payments/http";

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getPaymentCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  return handleEasebuzzCallback(request, "success");
}
