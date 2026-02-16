import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import {
  hasValidCronBearerToken,
  isCronSecretConfigured,
} from "@/lib/payments/auth";
import { markPublishedEventsCompleted } from "@/lib/queries/events";

const logger = getLogger("api-events-cron-sync-completed");

export async function GET(request: NextRequest) {
  try {
    if (!isCronSecretConfigured()) {
      return NextResponse.json(
        {
          error: "CRON_SECRET is not configured",
        },
        {
          status: 500,
        },
      );
    }

    const authorizationHeader = request.headers.get("authorization");
    if (!hasValidCronBearerToken(authorizationHeader)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const nowIso = new Date().toISOString();
    const updatedEvents = await markPublishedEventsCompleted(nowIso);

    return NextResponse.json(
      {
        ok: true,
        processedAt: nowIso,
        updatedCount: updatedEvents.length,
        updatedEventIds: updatedEvents.map((event) => event.id),
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    logger.error("Failed to run events completion cron sync", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Unable to run events completion cron sync",
      },
      {
        status: 500,
      },
    );
  }
}
