import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/events/service";
import { getLogger } from "@/lib/logger";

const logger = getLogger("coupons-api");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, code } = body;

    if (!eventId || !code) {
      return NextResponse.json(
        { error: "Missing eventId or code" },
        { status: 400 },
      );
    }

    const coupon = await validateCoupon({ eventId, code });
    return NextResponse.json(coupon);
  } catch (error: any) {
    logger.error("POST /api/coupons/validate error", { error: error.message });
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 400 },
    );
  }
}
