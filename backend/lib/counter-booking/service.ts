import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";
import { insertEventRegistration } from "@/lib/queries/event-registrations";
import {
  sendBookingSuccessEmail,
  sendBookingFailureEmail,
} from "@/lib/email/service";
import { generateTicketPDF } from "@/lib/pdfs/ticket-generator";

const logger = getLogger("counter-booking-service");

// Placeholder system user for offline / counter bookings (no real user account).
// This user exists in auth.users as 'offline-booking@akarwomengroup.com'.
const OFFLINE_BOOKING_USER_ID = "00000000-0000-0000-0000-000000000001";

export interface CounterBookingInput {
  eventId: string;
  firstName: string;
  email: string;
  phone: string;
  ticketsBought: Record<string, number>;
  formResponse?: Record<string, unknown>;
  bookingCategory: string;
  paymentMode: string;
  paymentStatus: string;
}

interface EventTicketRow {
  id: string;
  description: unknown;
  price: string;
}

interface EventRow {
  id: string;
  name: string;
  status: string;
  deleted_at: string | null;
  event_date: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  terms_and_conditions: string | null;
  event_tickets: EventTicketRow[];
}

function getTicketName(description: unknown): string {
  if (
    description &&
    typeof description === "object" &&
    !Array.isArray(description)
  ) {
    const d = description as Record<string, unknown>;
    if (typeof d.name === "string" && d.name) return d.name;
  }
  return "Ticket";
}

function getTicketType(description: unknown): string {
  if (
    description &&
    typeof description === "object" &&
    !Array.isArray(description)
  ) {
    const d = description as Record<string, unknown>;
    if (typeof d.type === "string" && d.type) return d.type;
  }
  return "Standard";
}

function mapPaymentStatusToDatabase(uiStatus: string): string {
  const s = uiStatus.toLowerCase().trim();
  if (
    [
      "paid",
      "partial paid",
      "adjustment",
      "complimentary",
      "sponsored",
    ].includes(s)
  ) {
    return "paid";
  }
  if (["failed", "refunded", "cancelled"].includes(s)) {
    return "failed"; // 'refunded' is not a standard type on the type definition sometimes, 'failed' is safer pending check
  }
  return "pending";
}

export async function createCounterBooking(input: CounterBookingInput) {
  const supabase = createSupabaseAdminClient();

  // 1. Fetch event + tickets
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id,name,status,deleted_at,event_date,address_line_1,city,state,terms_and_conditions,event_tickets(id,description,price)",
    )
    .eq("id", input.eventId)
    .is("deleted_at", null)
    .maybeSingle<EventRow>();

  if (eventError || !event) {
    throw new Error("Event not found or has been deleted");
  }

  if (!["published", "waitlist", "completed"].includes(event.status)) {
    throw new Error(
      `Counter bookings are not allowed for events with status: ${event.status}`,
    );
  }

  if (!event.event_tickets || event.event_tickets.length === 0) {
    throw new Error("This event has no tickets configured");
  }

  // 2. Validate ticketsBought and compute total
  const ticketMap = new Map(event.event_tickets.map((t) => [t.id, t]));

  if (Object.keys(input.ticketsBought).length === 0) {
    throw new Error("At least one ticket must be selected");
  }

  let totalAmount = 0;
  const ticketItems: {
    name: string;
    quantity: number;
    price: number;
    type: string;
  }[] = [];

  for (const [ticketId, qty] of Object.entries(input.ticketsBought)) {
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error(`Invalid quantity for ticket ${ticketId}`);
    }
    const ticket = ticketMap.get(ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} does not belong to this event`);
    }
    const price = parseFloat(ticket.price) || 0;
    totalAmount += price * qty;
    ticketItems.push({
      name: getTicketName(ticket.description),
      quantity: qty,
      price,
      type: getTicketType(ticket.description),
    });
  }

  const totalAmountStr = totalAmount.toFixed(2);

  // 3. Build unique registration name
  const suffix = randomUUID().slice(0, 12);
  const registrationName = `${event.name.trim().slice(0, 80)}-counter-${suffix}`;

  const now = new Date().toISOString();

  // 4. Insert registration (mapped db status, no user_id, no transaction_id)
  const dbPaymentStatus = mapPaymentStatusToDatabase(input.paymentStatus);
  const SELECT_FIELDS = "id,name,event_id,payment_status,created_at";

  const registration = await insertEventRegistration<{
    id: string;
    name: string;
    event_id: string;
    payment_status: string;
    created_at: string;
  }>(
    {
      event_id: input.eventId,
      user_id: OFFLINE_BOOKING_USER_ID,
      coupon_id: null,
      bundle_id: null,
      total_amount: totalAmountStr,
      final_amount: totalAmountStr,
      payment_status: dbPaymentStatus,
      form_response: {
        ...(input.formResponse ?? {}),
        _offline_name: input.firstName,
        _offline_email: input.email,
        _offline_phone: input.phone,
        _offline_category: input.bookingCategory,
        _offline_payment_mode: input.paymentMode,
        _offline_payment_status: input.paymentStatus,
        _source: "Offline Booking",
      },
      created_at: now,
      updated_at: now,
      deleted_at: null,
      name: registrationName,
      transaction_id: null,
      tickets_bought: input.ticketsBought,
      is_verified: null,
      is_waitlisted: false,
    },
    SELECT_FIELDS,
  );

  logger.info("Counter booking created", {
    bookingId: registration.id,
    eventId: input.eventId,
    email: input.email,
    totalAmount: totalAmountStr,
  });

  // 5. Build location string
  const location =
    [event.city, event.state].filter(Boolean).join(", ") ||
    event.address_line_1 ||
    "Check event page";

  // 6. Generate PDF and upload to Supabase Storage (Only if Paid)
  let pdfBuffer: Buffer | undefined;

  if (dbPaymentStatus === "paid" || dbPaymentStatus === "failed") {
    try {
      if (dbPaymentStatus === "paid") {
        pdfBuffer = await generateTicketPDF({
          eventName: event.name,
          userName: input.firstName,
          bookingId: registration.id,
          amount: `₹${totalAmountStr}`,
          location,
          eventDate: event.event_date
            ? new Date(event.event_date).toLocaleString()
            : "TBA",
          bookingDate: new Date().toISOString(),
          tickets: ticketItems.map((t) => ({
            name: t.name,
            type: t.type,
            quantity: t.quantity,
            price: t.price,
          })),
          eventTerms: event.terms_and_conditions ?? undefined,
          discountBreakdown: [], // No discounts for counter bookings yet
        });

        const fileName = `${registration.id}.pdf`;
        const { error: uploadError } = await createSupabaseAdminClient()
          .storage.from("tickets")
          .upload(fileName, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadError) {
          logger.error("Failed to upload counter ticket to Supabase Storage", {
            registrationId: registration.id,
            error: uploadError,
          });
        } else {
          const { data: publicUrlData } = createSupabaseAdminClient()
            .storage.from("tickets")
            .getPublicUrl(fileName);

          await createSupabaseAdminClient()
            .from("event_registrations")
            .update({ ticket_url: publicUrlData.publicUrl })
            .eq("id", registration.id);

          logger.info("Uploaded counter ticket and updated registration row", {
            registrationId: registration.id,
            url: publicUrlData.publicUrl,
          });
        }
      }

      // 7. Send ticket email (fire-and-forget)
      if (dbPaymentStatus === "paid") {
        sendBookingSuccessEmail(
          input.email,
          input.firstName,
          event.name,
          `₹${totalAmountStr}`,
          registration.id,
          ticketItems,
          registration.created_at,
          event.event_date ?? undefined,
          location,
          event.terms_and_conditions ?? undefined,
          [],
          pdfBuffer,
        ).catch((err) => {
          logger.error("Failed to send counter booking ticket email", {
            bookingId: registration.id,
            email: input.email,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    } catch (pdfGenError) {
      logger.error("Failed to generate or upload counter ticket PDF", {
        bookingId: registration.id,
        error:
          pdfGenError instanceof Error
            ? pdfGenError.message
            : String(pdfGenError),
      });
    }
  }

  return {
    bookingId: registration.id,
    registrationName: registration.name,
    totalAmount: totalAmountStr,
    eventName: event.name,
  };
}

/**
 * Updates the payment status and generates a ticket if it newly becomes "paid"
 */
export async function updateCounterBookingPaymentStatus(
  bookingId: string,
  newPaymentStatus: string,
) {
  const supabase = createSupabaseAdminClient();
  const dbPaymentStatus = mapPaymentStatusToDatabase(newPaymentStatus);

  // 1. Fetch the registration and related event
  const { data: registration, error: regError } = await supabase
    .from("event_registrations")
    .select(
      `
      *,
      events (
         id, name, status, event_date, address_line_1, city, state, terms_and_conditions, event_tickets(id, description, price)
      )
    `,
    )
    .eq("id", bookingId)
    .single();

  if (regError || !registration || !registration.events) {
    throw new Error("Booking or Event not found");
  }

  const oldDbStatus = registration.payment_status;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = registration.events as any; // Cast for simplicity since we selected what we need
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formResponse = (registration.form_response || {}) as Record<
    string,
    any
  >;
  const isNewlyPaid = oldDbStatus !== "paid" && dbPaymentStatus === "paid";

  // Update logic: set db enum, and update form_response string
  const newFormResponse = {
    ...formResponse,
    _offline_payment_status: newPaymentStatus,
  };

  const { error: updateError } = await supabase
    .from("event_registrations")
    .update({
      payment_status: dbPaymentStatus,
      form_response: newFormResponse,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    throw new Error(`Failed to update booking status: ${updateError.message}`);
  }

  logger.info("Updated counter booking status", {
    bookingId,
    newPaymentStatus,
    dbPaymentStatus,
  });

  // If nicely transitioned to paid, generate ticket & email
  if (isNewlyPaid) {
    try {
      // Rebuild inputs for ticket generation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ticketMap = new Map(
        (event.event_tickets || []).map((t: any) => [t.id, t]),
      );
      const ticketsBought = (registration.tickets_bought || {}) as Record<
        string,
        number
      >;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ticketItems: any[] = [];
      let calculatedTotal = 0;

      for (const [ticketId, qty] of Object.entries(ticketsBought)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ticket = ticketMap.get(ticketId) as any;
        if (ticket) {
          const price = parseFloat(ticket.price) || 0;
          calculatedTotal += price * qty;
          ticketItems.push({
            name: getTicketName(ticket.description),
            quantity: qty,
            price,
            type: getTicketType(ticket.description),
          });
        }
      }

      const totalAmountStr = calculatedTotal.toFixed(2);
      const email = formResponse._offline_email || "N/A";
      const firstName =
        formResponse._offline_name || registration.name || "Attendee";
      const location =
        [event.city, event.state].filter(Boolean).join(", ") ||
        event.address_line_1 ||
        "Check event page";

      const pdfBuffer = await generateTicketPDF({
        eventName: event.name,
        userName: firstName,
        bookingId: registration.id,
        amount: `₹${totalAmountStr}`,
        location,
        eventDate: event.event_date
          ? new Date(event.event_date).toLocaleString()
          : "TBA",
        bookingDate: new Date(registration.created_at).toISOString(),
        tickets: ticketItems,
        eventTerms: event.terms_and_conditions ?? undefined,
        discountBreakdown: [],
      });

      const fileName = `${registration.id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("tickets")
        .upload(fileName, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("tickets")
          .getPublicUrl(fileName);
        await supabase
          .from("event_registrations")
          .update({ ticket_url: publicUrlData.publicUrl })
          .eq("id", registration.id);
      }

      // Fire and forget email
      sendBookingSuccessEmail(
        email,
        firstName,
        event.name,
        `₹${totalAmountStr}`,
        registration.id,
        ticketItems,
        registration.created_at,
        event.event_date ?? undefined,
        location,
        event.terms_and_conditions ?? undefined,
        [],
        pdfBuffer,
      ).catch((err) => {
        logger.error("Failed to send counter booking ticket email on update", {
          bookingId: registration.id,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    } catch (pdfGenError) {
      logger.error("Failed to generate/upload ticket on status update", {
        bookingId,
        error:
          pdfGenError instanceof Error
            ? pdfGenError.message
            : String(pdfGenError),
      });
    }
  }

  return { success: true };
}
