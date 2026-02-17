import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";
import { listEventFormFieldsForValidation } from "@/lib/queries/event-form-fields";
import { getEventBookingMeta } from "@/lib/queries/events";
import {
  getEventRegistrationForUserEvent,
  insertEventRegistration,
  updateEventRegistrationById,
} from "@/lib/queries/event-registrations";
import {
  BOOKING_PAGE_LIMIT,
  BOOKING_SELECT_FIELDS,
} from "@/lib/bookings/queries";
import { sendWishlistConfirmation } from "@/lib/email/service";

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
  bundle_id: string | null;
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
  is_waitlisted: boolean | null;
  ticket_url: string | null;
  events: {
    name: string;
    event_date: string | null;
    base_event_banner: string | null;
    address_line_1: string | null;
    city: string | null;
    state: string | null;
    terms_and_conditions: string | null;
    event_tickets: {
      id: string;
      description: JsonValue;
      price: string;
    }[];
  } | null;
};

type EventRow = {
  id: string;
  name: string;
  status: string;
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
  registrationId?: string | null;
  couponId?: string | null;
  bundleId?: string | null;
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
  isWaitlisted: boolean;
  ticketUrl: string | null;
  event: {
    name: string;
    date: string | null;
    bannerUrl: string | null;
    location: string;
    termsAndConditions?: string | null;
  };
  tickets: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    type: string;
  }[];
};

type BookingMode = "payment" | "waitlist";

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
    isWaitlisted: Boolean(row.is_waitlisted),
    ticketUrl: row.ticket_url || null,
    event: {
      name: row.events?.name || "Unknown Event",
      date: row.events?.event_date || null,
      bannerUrl: row.events?.base_event_banner || null,
      termsAndConditions: row.events?.terms_and_conditions || null,
      location:
        `${row.events?.city || ""}, ${row.events?.state || ""}`.replace(
          /^, |, $/g,
          "",
        ) ||
        row.events?.address_line_1 ||
        "",
    },
    tickets: Object.entries(row.tickets_bought || {}).map(([ticketId, qty]) => {
      const ticketDef = row.events?.event_tickets?.find(
        (t) => t.id === ticketId,
      );
      const description = ticketDef?.description as Record<
        string,
        unknown
      > | null;
      return {
        id: ticketId,
        name:
          (typeof description?.name === "string" ? description.name : null) ||
          "Ticket",
        price: ticketDef ? toNumber(ticketDef.price) : 0,
        quantity: qty,
        type:
          (typeof description?.type === "string" ? description.type : null) ||
          "Standard",
      };
    }),
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

function normalizeNonNegativeAmount(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("amount must be a non-negative number");
  }
  return amount;
}

function normalizePhone(value: unknown) {
  const phone = normalizeNonEmptyString(value, "phone");
  // Strict validation: exactly 10 digits, no symbols or spaces
  if (!/^\d{10}$/.test(phone)) {
    throw new Error("phone must be exactly 10 digits");
  }
  return phone;
}

function normalizeJsonObject(value: unknown): JsonValue {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("form_response must be a JSON object");
  }

  return value as JsonValue;
}

function normalizeTicketsBought(value: unknown) {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      "tickets_bought must be an object map of ticketId -> quantity",
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
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
  const bundleIdRaw = payload.bundleId || payload.bundle_id;
  const registrationIdRaw = payload.registrationId || payload.registration_id;
  let couponId: string | null = null;
  let bundleId: string | null = null;
  let registrationId: string | null = null;
  if (couponIdRaw) {
    const cid = normalizeNonEmptyString(couponIdRaw, "couponId");
    if (!isUuid(cid)) {
      throw new Error("couponId must be a valid UUID");
    }
    couponId = cid;
  }
  if (bundleIdRaw) {
    const bid = normalizeNonEmptyString(bundleIdRaw, "bundleId");
    if (!isUuid(bid)) {
      throw new Error("bundleId must be a valid UUID");
    }
    bundleId = bid;
  }
  if (registrationIdRaw) {
    const rid = normalizeNonEmptyString(registrationIdRaw, "registrationId");
    if (!isUuid(rid)) {
      throw new Error("registrationId must be a valid UUID");
    }
    registrationId = rid;
  }

  return {
    eventId,
    firstName: normalizeNonEmptyString(payload.firstName, "firstName"),
    email: normalizeEmail(payload.email),
    phone: normalizePhone(payload.phone),
    eventName: normalizeNonEmptyString(payload.eventName, "eventName"),
    amount: normalizeNonNegativeAmount(payload.amount),
    ticketsBought: normalizeTicketsBought(
      payload.ticketsBought || payload.tickets_bought,
    ),
    registrationId,
    couponId,
    bundleId,
    formResponse: normalizeJsonObject(
      payload.formResponse || payload.form_response,
    ),
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

function resolveBookingMode(eventStatus: string): BookingMode {
  if (eventStatus === "waitlist") {
    return "waitlist";
  }
  return "payment";
}

function validateEventStatusForBooking(eventStatus: string) {
  if (eventStatus === "published" || eventStatus === "waitlist") {
    return;
  }

  if (eventStatus === "draft") {
    throw new Error("Bookings are not open for draft events");
  }
  if (eventStatus === "cancelled") {
    throw new Error("Bookings are not allowed for cancelled events");
  }
  if (eventStatus === "completed") {
    throw new Error("Bookings are not allowed for completed events");
  }

  throw new Error("Bookings are not allowed for this event status");
}

async function ensureEventExists(eventId: string) {
  let data: EventRow | null = null;
  try {
    data = (await getEventBookingMeta(eventId)) as EventRow | null;
  } catch (error) {
    logger.error("Failed to load event while initiating booking", {
      eventId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Unable to validate event");
  }

  if (!data) {
    throw new Error("Event not found");
  }

  validateEventStatusForBooking(data.status);
  return data;
}

type TriggerableOption = {
  value?: string;
  triggers?: string[];
};

function isTriggerableOption(option: unknown): option is TriggerableOption {
  return Boolean(
    option && typeof option === "object" && !Array.isArray(option),
  );
}

async function validateFormResponse(eventId: string, formResponse: JsonValue) {
  let fields;
  try {
    fields = await listEventFormFieldsForValidation(eventId);
  } catch (error) {
    logger.error("Failed to fetch form fields for validation", {
      eventId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Unable to validate form fields");
  }

  if (!fields.length) return;

  const responseObj = (formResponse || {}) as Record<string, unknown>;

  // 1. Calculate Visible Fields
  const visibleFieldNames = new Set<string>();

  // Initialize with non-hidden fields
  fields.forEach((f) => {
    if (!f.is_hidden) visibleFieldNames.add(f.field_name);
  });

  // Iteratively trigger fields based on values
  fields.forEach((field) => {
    const value = responseObj[field.field_name];
    if (
      value &&
      (field.field_type === "dropdown" || field.field_type === "select") &&
      Array.isArray(field.options)
    ) {
      const selectedOption = field.options.find((opt: unknown) => {
        if (typeof opt === "string") {
          return opt === value;
        }
        if (isTriggerableOption(opt)) {
          return opt.value === value;
        }
        return false;
      });

      if (
        selectedOption &&
        isTriggerableOption(selectedOption) &&
        Array.isArray(selectedOption.triggers)
      ) {
        selectedOption.triggers.forEach((trigger) => {
          visibleFieldNames.add(trigger);
        });
      }
    }
  });

  // 2. Validate Required Fields
  for (const field of fields) {
    if (visibleFieldNames.has(field.field_name) && field.is_required) {
      const value = responseObj[field.field_name];
      // Check for empty values. null, undefined, empty string.
      // 0 is valid. false is valid (checkbox?).
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      ) {
        throw new Error(`Field '${field.label}' is required`);
      }
    }
  }
}

export async function createBookingForUser(params: {
  userId: string;
  input: InitiateBookingInput;
}) {
  const { userId, input } = params;

  const event = await ensureEventExists(input.eventId);

  // Validate Form Response
  await validateFormResponse(input.eventId, input.formResponse || {});

  const bookingMode = resolveBookingMode(event.status);
  if (
    bookingMode === "payment" &&
    Object.keys(input.ticketsBought).length === 0
  ) {
    throw new Error("tickets_bought cannot be empty");
  }

  const subtotal = input.amount;
  const finalAmount = input.amount;

  const now = new Date().toISOString();

  let data: BookingRow;
  if (bookingMode === "payment" && input.registrationId) {
    const existing = await getEventRegistrationForUserEvent({
      registrationId: input.registrationId,
      userId,
      eventId: input.eventId,
    });

    if (!existing) {
      throw new Error(
        "Existing registration not found for this user and event",
      );
    }
    if (existing.deleted_at) {
      throw new Error("Existing registration is cancelled");
    }
    if (!existing.is_waitlisted) {
      throw new Error(
        "Existing registration is not eligible for waitlist conversion",
      );
    }

    try {
      data = await updateEventRegistrationById<BookingRow>({
        registrationId: input.registrationId,
        payload: {
          coupon_id: input.couponId ?? null,
          bundle_id: input.bundleId ?? null,
          total_amount: normalizeAmount(subtotal),
          final_amount: normalizeAmount(finalAmount),
          payment_status: "pending",
          form_response: input.formResponse ?? {},
          updated_at: now,
          transaction_id: null,
          tickets_bought: input.ticketsBought,
          is_verified: event.verification_required ? false : null,
          is_waitlisted: false,
        },
        selectFields: BOOKING_SELECT_FIELDS,
      });
    } catch (error) {
      logger.error("Failed to update existing waitlist booking registration", {
        registrationId: input.registrationId,
        userId,
        eventId: input.eventId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error("Unable to update booking");
    }
  } else {
    const insertPayload = {
      event_id: input.eventId,
      user_id: userId,
      coupon_id: input.couponId ?? null,
      bundle_id: input.bundleId ?? null,
      total_amount: normalizeAmount(subtotal),
      final_amount: normalizeAmount(finalAmount),
      payment_status: "pending",
      form_response: input.formResponse ?? {},
      created_at: now,
      updated_at: now,
      deleted_at: null,
      name: buildUniqueRegistrationName(event.name),
      transaction_id: null,
      tickets_bought: input.ticketsBought,
      is_verified: event.verification_required ? false : null,
      is_waitlisted: bookingMode === "waitlist",
    };

    try {
      data = await insertEventRegistration<BookingRow>(
        insertPayload,
        BOOKING_SELECT_FIELDS,
      );
    } catch (error) {
      logger.error("Failed to create booking registration", {
        userId,
        eventId: input.eventId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error("Unable to create booking");
    }
  }

  // Send Waitlist Confirmation Email
  if (bookingMode === "waitlist") {
    // Fire and forget - do not block response
    sendWishlistConfirmation(input.email, input.firstName, event.name).catch(
      (err) => {
        logger.error("Failed to send waitlist confirmation email", {
          bookingId: data.id,
          email: input.email,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      },
    );
  }

  return {
    bookingMode,
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
