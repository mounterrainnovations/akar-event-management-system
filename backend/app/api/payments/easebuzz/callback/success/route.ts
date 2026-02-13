import { NextRequest } from "next/server";
import { POST as callbackPost, OPTIONS as callbackOptions } from "@/app/api/payments/easebuzz/callback/route";

export async function OPTIONS(request: NextRequest) {
  return callbackOptions(request);
}

export async function POST(request: NextRequest) {
  return callbackPost(request);
}
