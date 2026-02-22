import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";
import { insertEventRegistration } from "@/lib/queries/event-registrations";
import { sendBookingSuccessEmail } from "@/lib/email/service";

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

  // 4. Insert registration (paid, no user_id, no transaction_id)
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
      payment_status: "paid",
      form_response: {
        ...(input.formResponse ?? {}),
        _offline_name: input.firstName,
        _offline_email: input.email,
        _offline_phone: input.phone,
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

  // 6. Send ticket email (fire-and-forget)
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
  ).catch((err) => {
    logger.error("Failed to send counter booking ticket email", {
      bookingId: registration.id,
      email: input.email,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return {
    bookingId: registration.id,
    registrationName: registration.name,
    totalAmount: totalAmountStr,
    eventName: event.name,
  };
}
