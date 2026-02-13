"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getLogger } from "@/lib/logger";
import { updateEventStatus } from "@/lib/events/service";

const logger = getLogger("admin-events-new-actions");

function toEventsNewUrl(params?: {
  includeDeleted?: boolean;
  success?: string;
  error?: string;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("section", "events-new");

  if (params?.includeDeleted) {
    searchParams.set("includeDeleted", "1");
  }
  if (params?.success) {
    searchParams.set("success", params.success);
  }
  if (params?.error) {
    searchParams.set("error", params.error);
  }

  return `/admin?${searchParams.toString()}`;
}

export async function cancelEventAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login?error=Please+sign+in+again");
  }

  const eventId = formData.get("eventId");
  if (typeof eventId !== "string" || !eventId.trim()) {
    redirect(toEventsNewUrl({ error: "Invalid event ID" }));
  }

  const includeDeleted = formData.get("includeDeleted") === "1";

  try {
    await updateEventStatus({ eventId: eventId.trim(), status: "cancelled" });
  } catch (error) {
    logger.error("cancelEventAction failed", {
      userId: session.sub,
      eventId,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    redirect(
      toEventsNewUrl({
        includeDeleted,
        error:
          error instanceof Error ? error.message : "Failed to cancel event",
      }),
    );
  }

  redirect(
    toEventsNewUrl({
      includeDeleted,
      success: "Event cancelled",
    }),
  );
}

export async function publishEventAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login?error=Please+sign+in+again");
  }

  const eventId = formData.get("eventId");
  if (typeof eventId !== "string" || !eventId.trim()) {
    redirect(toEventsNewUrl({ error: "Invalid event ID" }));
  }

  const includeDeleted = formData.get("includeDeleted") === "1";

  try {
    await updateEventStatus({ eventId: eventId.trim(), status: "published" });
  } catch (error) {
    logger.error("publishEventAction failed", {
      userId: session.sub,
      eventId,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    redirect(
      toEventsNewUrl({
        includeDeleted,
        error:
          error instanceof Error ? error.message : "Failed to publish event",
      }),
    );
  }

  redirect(
    toEventsNewUrl({
      includeDeleted,
      success: "Event published",
    }),
  );
}
