import { NextResponse } from "next/server";
import { createRegistration } from "@/lib/events/service";
import { getLogger } from "@/lib/logger";

const logger = getLogger("registrations-api");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eventId,
      userId,
      quantity,
      totalAmount,
      finalAmount,
      formResponse,
    } = body;

    if (!eventId || !quantity || !formResponse) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const registrationId = await createRegistration({
      eventId,
      userId,
      quantity,
      totalAmount,
      finalAmount,
      formResponse,
    });

    return NextResponse.json({ registrationId });
  } catch (error: any) {
    logger.error("POST /api/registrations error", { error: error.message });
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
