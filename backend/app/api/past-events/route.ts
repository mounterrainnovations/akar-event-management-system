import { NextResponse } from "next/server";
import { listPastEvents } from "@/lib/past-events/service";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api-past-events");

export async function GET(request: Request) {
  try {
    const pastEvents = await listPastEvents();

    return NextResponse.json(pastEvents, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    logger.error("Failed to fetch past events", { error });
    return NextResponse.json(
      { error: "Failed to fetch past events" },
      { status: 500 },
    );
  }
}
