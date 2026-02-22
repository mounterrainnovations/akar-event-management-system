"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createEvent,
  updateEvent,
  updateEventStatus,
  type EventWriteInput,
} from "@/lib/events/service";
import { getLogger } from "@/lib/logger";
import {
  sendBookingSuccessEmail,
  sendBookingFailureEmail,
  sendWishlistConfirmation,
} from "@/lib/email/service";

const logger = getLogger("events-new-actions");

export async function uploadEventBannerAction(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { error: "No file provided" };
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!validTypes.includes(file.type)) {
    return { error: "Invalid file type. Only PNG and JPG are allowed." };
  }

  // Validate file size (e.g., 5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File size exceeds 5MB limit." };
  }

  const supabase = createSupabaseAdminClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `banner-${fileName}`;

  const { error } = await supabase.storage
    .from("eventBanner")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    logger.error("Failed to upload event banner", { error: error.message });
    return { error: "Failed to upload image. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("eventBanner").getPublicUrl(filePath);

  return { publicUrl };
}

export async function createEventAction(input: EventWriteInput) {
  try {
    const eventId = await createEvent({
      ...input,
      status: input.status || "published",
    });
    revalidatePath("/admin?section=events");
    return { success: true, eventId };
  } catch (error) {
    logger.error("Failed to create event action", { error });
    return { error: "Failed to create event. Please try again." };
  }
}

export async function updateEventAction(
  eventId: string,
  input: EventWriteInput,
) {
  try {
    await updateEvent({
      eventId,
      input,
    });
    revalidatePath("/admin?section=events");
    return { success: true, eventId };
  } catch (error) {
    logger.error("Failed to update event action", { eventId, error });
    return { error: "Failed to update event. Please try again." };
  }
}

export async function cancelEventAction(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  if (!eventId) return { error: "Event ID is required" };

  try {
    await updateEventStatus({ eventId, status: "cancelled" });
    revalidatePath("/admin?section=events");
    return { success: true };
  } catch (error) {
    logger.error("Failed to cancel event", { eventId, error });
    return { error: "Failed to cancel event" };
  }
}

export async function publishEventAction(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  if (!eventId) return { error: "Event ID is required" };

  try {
    await updateEventStatus({ eventId, status: "published" });
    revalidatePath("/admin?section=events");
    return { success: true };
  } catch (error) {
    logger.error("Failed to publish event", { eventId, error });
    return { error: "Failed to publish event" };
  }
}

export async function moveToDraftAction(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  if (!eventId) return { error: "Event ID is required" };

  try {
    await updateEventStatus({ eventId, status: "draft" });
    revalidatePath("/admin?section=events");
    return { success: true };
  } catch (error) {
    logger.error("Failed to move event to draft", { eventId, error });
    return { error: "Failed to move event to draft" };
  }
}

export async function listAllRegistrationsAction() {
  const { listAllRegistrations } = await import("@/lib/events/service");
  try {
    const bookings = await listAllRegistrations();
    return { success: true, bookings };
  } catch (error) {
    logger.error("Failed to list all registrations action", { error });
    return { error: "Failed to load bookings. Please try again." };
  }
}

export async function resendBookingEmailAction(booking: any) {
  try {
    const {
      paymentStatus,
      userEmail,
      userName,
      name,
      eventName,
      finalAmount,
      id,
      eventId,
    } = booking;
    const finalEmail = userEmail || "";
    const finalName = userName || name || "Guest User";

    // Fetch event details to pass correct parameters for Success email
    let eventDetails = null;
    try {
      const { getPublicEventDetail } = await import("@/lib/events/service");
      eventDetails = await getPublicEventDetail(eventId);
    } catch (e) {
      logger.warn("Could not fetch event details for resending email", {
        eventId,
      });
    }

    const payStatus = (paymentStatus || "").toLowerCase();

    if (payStatus === "paid" || payStatus === "success") {
      const tickets: {
        name: string;
        quantity: number;
        price: number;
        type: string;
      }[] = [];
      if (booking.ticketsBought && eventDetails) {
        Object.entries(booking.ticketsBought).forEach(([ticketId, qty]) => {
          const matchedTicket = eventDetails.tickets.find(
            (t: any) => t.id === ticketId,
          );
          const tDesc = matchedTicket?.description as { name?: string } | null;
          const ticketName =
            tDesc?.name || booking.ticketName || "General Ticket";
          tickets.push({
            name: ticketName,
            quantity: Number(qty) || 0,
            price: matchedTicket ? matchedTicket.price : 0,
            type: "General",
          });
        });
      }

      await sendBookingSuccessEmail(
        finalEmail,
        finalName,
        eventName,
        String(finalAmount),
        id,
        tickets,
        new Date(booking.createdAt).toISOString(),
        eventDetails?.event.eventDate || "TBA",
        eventDetails?.event.address1 || "TBA",
        eventDetails?.event.termsAndConditions || "Standard terms apply.",
        undefined,
        undefined,
      );
    } else if (payStatus === "failed") {
      await sendBookingFailureEmail(
        finalEmail,
        finalName,
        eventName,
        String(finalAmount),
        id,
      );
    } else if (
      payStatus === "wishlist" ||
      payStatus === "waitlist" ||
      payStatus === "pending"
    ) {
      // User requested: "For wishlist: Its wishlist email"
      await sendWishlistConfirmation(finalEmail, finalName, eventName);
    } else {
      return { error: `No email template for status: ${paymentStatus}` };
    }

    return { success: true };
  } catch (error) {
    logger.error("Failed to resend email", { error });
    return { error: "Failed to resend email. Please try again." };
  }
}
