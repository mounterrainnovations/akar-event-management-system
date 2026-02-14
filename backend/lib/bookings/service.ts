import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";
import {
  BOOKING_PAGE_LIMIT,
  BOOKING_SELECT_FIELDS,
  EVENT_EXISTENCE_SELECT_FIELDS,
} from "@/lib/bookings/queries";

const logger = getLogger("bookings-service");

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

type BookingRow = {
  id: string;
  event_id: string;
  user_id: string;
  coupon_id: string | null;
  total_amount: string;
  final_amount: string;
  payment_status: string;
  form_response: JsonValue;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  transaction_id: string | null;
  tickets_bought: Record<string, number> | null;
  is_verified: boolean | null;
};

type EventRow = {
  id: string;
  name: string;
  verification_required: boolean;
  deleted_at: string | null;
};

export type InitiateBookingInput = {
  eventId: string;
  firstName: string;
  email: string;
  phone: string;
  eventName: string;
  amount: number;
  ticketsBought: Record<string, number>;
  couponId?: string | null;
  formResponse?: JsonValue;
};

export type BookingRecord = {
  id: string;
  eventId: string;
  userId: string;
  couponId: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: string;
  formResponse: JsonValue;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  name: string;
  transactionId: string | null;
  ticketsBought: Record<string, number>;
  isVerified: boolean | null;
};

export type BookingListResult = {
  page: number;
  limit: number;
  total: number;
  items: BookingRecord[];
};

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }
  if (!value) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeAmount(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Amount must be a valid non-negative number");
  }

  return value.toFixed(2);
}

function buildUniqueRegistrationName(eventName: string) {
  const base = eventName.trim().slice(0, 80) || "booking";
  const suffix = randomUUID().slice(0, 12);
  return `${base}-${suffix}`;
}

function mapBooking(row: BookingRow): BookingRecord {
  const totalAmount = toNumber(row.total_amount);
  const finalAmount = toNumber(row.final_amount);
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    couponId: row.coupon_id,
    totalAmount,
    discountAmount: Math.max(totalAmount - finalAmount, 0),
    finalAmount,
    paymentStatus: row.payment_status,
    formResponse: row.form_response,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    name: row.name,
    transactionId: row.transaction_id,
    ticketsBought: row.tickets_bought || {},
    isVerified: row.is_verified,
  };
}

function normalizeNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
}

function normalizeEmail(value: unknown) {
  const email = normalizeNonEmptyString(value, "email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("email must be valid");
  }
  return email.toLowerCase();
}

function normalizePositiveAmount(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount must be a positive number");
  }
  return amount;
}

function normalizePhone(value: unknown) {
  const phone = normalizeNonEmptyString(value, "phone");
  if (!/^[0-9+()\-\s]{7,20}$/.test(phone)) {
    throw new Error("phone must be valid");
  }
  return phone;
}

function normalizeJsonObject(value: unknown): JsonValue {
  if (value === undefined) {
    return {};
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("form_response must be a JSON object");
  }

  return value as JsonValue;
}

function normalizeTicketsBought(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      "tickets_bought must be an object map of ticketId -> quantity",
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    throw new Error("tickets_bought cannot be empty");
  }

  const normalized: Record<string, number> = {};
  for (const [ticketId, quantity] of entries) {
    if (!isUuid(ticketId)) {
      throw new Error(`Invalid ticket id in tickets_bought: ${ticketId}`);
    }

    const parsedQuantity =
      typeof quantity === "number"
        ? quantity
        : typeof quantity === "string"
          ? Number.parseInt(quantity, 10)
          : Number.NaN;

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      throw new Error(`Invalid quantity for ticket ${ticketId}`);
    }

    normalized[ticketId] = parsedQuantity;
  }

  return normalized;
}

export function parseInitiateBookingInput(body: unknown): InitiateBookingInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid request body");
  }

  const payload = body as Record<string, unknown>;
  const eventId = normalizeNonEmptyString(payload.eventId, "eventId");
  if (!isUuid(eventId)) {
    throw new Error("eventId must be a valid UUID");
  }

  const couponIdRaw = payload.couponId || payload.coupon_id;
  let couponId: string | null = null;
  if (couponIdRaw) {
    const cid = normalizeNonEmptyString(couponIdRaw, "couponId");
    if (!isUuid(cid)) {
      throw new Error("couponId must be a valid UUID");
    }
    couponId = cid;
  }

  return {
    eventId,
    firstName: normalizeNonEmptyString(payload.firstName, "firstName"),
    email: normalizeEmail(payload.email),
    phone: normalizePhone(payload.phone),
    eventName: normalizeNonEmptyString(payload.eventName, "eventName"),
    amount: normalizePositiveAmount(payload.amount),
    ticketsBought: normalizeTicketsBought(payload.tickets_bought),
    couponId,
    formResponse: normalizeJsonObject(payload.form_response),
  };
}

export function parsePaginationParams(searchParams: URLSearchParams) {
  const pageRaw = searchParams.get("page") || "1";
  const limitRaw = searchParams.get("limit") || String(BOOKING_PAGE_LIMIT);

  const page = Number.parseInt(pageRaw, 10);
  const requestedLimit = Number.parseInt(limitRaw, 10);

  if (!Number.isInteger(page) || page < 1) {
    throw new Error("page must be a positive integer");
  }

  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
    throw new Error("limit must be a positive integer");
  }

  return {
    page,
    limit: Math.min(requestedLimit, BOOKING_PAGE_LIMIT),
    from: (page - 1) * Math.min(requestedLimit, BOOKING_PAGE_LIMIT),
    to: page * Math.min(requestedLimit, BOOKING_PAGE_LIMIT) - 1,
  };
}

async function ensureEventExists(eventId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_EXISTENCE_SELECT_FIELDS)
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle<EventRow>();

  if (error) {
    logger.error("Failed to load event while initiating booking", {
      eventId,
      message: error.message,
    });
    throw new Error("Unable to validate event");
  }

  if (!data) {
    throw new Error("Event not found");
  }

  return data;
}

export async function createBookingForUser(params: {
  userId: string;
  input: InitiateBookingInput;
}) {
  const { userId, input } = params;

  const event = await ensureEventExists(input.eventId);
  const subtotal = input.amount;
  const finalAmount = input.amount;

  const now = new Date().toISOString();
  const supabase = createSupabaseAdminClient();

  const insertPayload = {
    event_id: input.eventId,
    user_id: userId,
    coupon_id: input.couponId ?? null,
    total_amount: normalizeAmount(subtotal),
    final_amount: normalizeAmount(finalAmount),
    payment_status: "pending",
    form_response: input.formResponse ?? {},
    created_at: now,
    updated_at: now,
    deleted_at: null,
    name: buildUniqueRegistrationName(input.eventName),
    transaction_id: null,
    tickets_bought: input.ticketsBought,
    is_verified: event.verification_required ? false : null,
  };

  const { data, error } = await supabase
    .from("event_registrations")
    .insert(insertPayload)
    .select(BOOKING_SELECT_FIELDS)
    .single<BookingRow>();

  if (error || !data) {
    logger.error("Failed to create booking registration", {
      userId,
      eventId: input.eventId,
      message: error?.message || "No row returned",
    });

    throw new Error("Unable to create booking");
  }

  return {
    booking: mapBooking(data),
    pricing: {
      subtotal,
      discountAmount: 0,
      finalAmount,
    },
  };
}

export async function listBookingsForUser(params: {
  userId: string;
  page: number;
  limit: number;
  eventId?: string;
}) {
  const { userId, page, limit, eventId } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("event_registrations")
    .select(BOOKING_SELECT_FIELDS, { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error, count } = await query.returns<BookingRow[]>();

  if (error) {
    logger.error("Failed to list bookings", {
      userId,
      eventId: eventId || null,
      message: error.message,
    });
    throw new Error("Unable to load bookings");
  }

  return {
    page,
    limit,
    total: count || 0,
    items: (data || []).map(mapBooking),
  } satisfies BookingListResult;
}

export async function listAllBookings(params: {
  page: number;
  limit: number;
  eventId?: string;
  includeDeleted?: boolean;
}) {
  const { page, limit, eventId, includeDeleted = false } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("event_registrations")
    .select(BOOKING_SELECT_FIELDS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error, count } = await query.returns<BookingRow[]>();

  if (error) {
    logger.error("Failed to list all bookings", {
      eventId: eventId || null,
      includeDeleted,
      message: error.message,
    });
    throw new Error("Unable to load all bookings");
  }

  return {
    page,
    limit,
    total: count || 0,
    items: (data || []).map(mapBooking),
  } satisfies BookingListResult;
}

export async function getBookingByIdForUser(params: {
  userId: string;
  bookingId: string;
}) {
  const { userId, bookingId } = params;
  if (!isUuid(bookingId)) {
    throw new Error("bookingId must be a valid UUID");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("event_registrations")
    .select(BOOKING_SELECT_FIELDS)
    .eq("id", bookingId)
    .eq("user_id", userId)
    .maybeSingle<BookingRow>();

  if (error) {
    logger.error("Failed to fetch booking by id", {
      bookingId,
      userId,
      message: error.message,
    });
    throw new Error("Unable to load booking");
  }

  if (!data) {
    return null;
  }

  return mapBooking(data);
}

export async function cancelBookingForUser(params: {
  userId: string;
  bookingId: string;
}) {
  const { userId, bookingId } = params;
  if (!isUuid(bookingId)) {
    throw new Error("bookingId must be a valid UUID");
  }

  const existing = await getBookingByIdForUser({ userId, bookingId });
  if (!existing) {
    throw new Error("Booking not found");
  }

  if (existing.deletedAt) {
    throw new Error("Booking is already cancelled");
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("event_registrations")
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", bookingId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select(BOOKING_SELECT_FIELDS)
    .maybeSingle<BookingRow>();

  if (error) {
    logger.error("Failed to cancel booking", {
      bookingId,
      userId,
      message: error.message,
    });
    throw new Error("Unable to cancel booking");
  }

  if (!data) {
    throw new Error("Booking not found");
  }

  return mapBooking(data);
}
