"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getLogger } from "@/lib/logger";
import {
  isDiscountType,
  isEventStatus,
  isPaymentStatus,
  isTicketStatus,
  type PaymentStatus,
} from "@/lib/events/enums";
import {
  createEvent,
  createEventCoupon,
  createEventFormField,
  createEventTicket,
  deleteEventFormField,
  restoreEvent,
  softDeleteEvent,
  softDeleteEventCoupon,
  softDeleteEventTicket,
  updateEvent,
  updateEventCoupon,
  updateEventFormField,
  updateEventTicket,
  verifyEventRegistration,
  type CouponWriteInput,
  type EventWriteInput,
  type FormFieldWriteInput,
  type TicketWriteInput,
} from "@/lib/events/service";

const logger = getLogger("admin-events-actions");

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

function toAdminEventsUrl(params?: {
  eventId?: string;
  includeDeleted?: boolean;
  paymentStatus?: PaymentStatus;
  success?: string;
  error?: string;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("section", "events");

  if (params?.eventId) {
    searchParams.set("eventId", params.eventId);
  }
  if (params?.includeDeleted) {
    searchParams.set("includeDeleted", "1");
  }
  if (params?.paymentStatus) {
    searchParams.set("paymentStatus", params.paymentStatus);
  }
  if (params?.success) {
    searchParams.set("success", params.success);
  }
  if (params?.error) {
    searchParams.set("error", params.error);
  }

  return `/admin?${searchParams.toString()}`;
}

async function ensureSession() {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login?error=Please+sign+in+again");
  }
  return session;
}

function asString(formData: FormData, key: string, required = false) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    if (required) {
      throw new Error(`${key} is required`);
    }
    return "";
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    throw new Error(`${key} is required`);
  }
  return trimmed;
}

function parseOptionalNumber(formData: FormData, key: string) {
  const raw = asString(formData, key);
  if (!raw) {
    return null;
  }
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${key}`);
  }
  return parsed;
}

function parseOptionalInteger(formData: FormData, key: string) {
  const raw = asString(formData, key);
  if (!raw) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${key}`);
  }
  return parsed;
}

function parseRequiredNumber(formData: FormData, key: string) {
  const value = parseOptionalNumber(formData, key);
  if (value === null) {
    throw new Error(`${key} is required`);
  }
  return value;
}

function parseOptionalDate(formData: FormData, key: string) {
  const raw = asString(formData, key);
  if (!raw) {
    return null;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${key}`);
  }
  return date.toISOString();
}

function parseOptionalJson(formData: FormData, key: string): JsonValue | null {
  const raw = asString(formData, key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as JsonValue;
  } catch {
    throw new Error(`Invalid JSON in ${key}`);
  }
}

function parseBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function parseEventStatus(formData: FormData, key: string) {
  const raw = asString(formData, key, true);
  if (!isEventStatus(raw)) {
    throw new Error(`Invalid ${key}`);
  }
  return raw;
}

function parseTicketStatus(formData: FormData, key: string) {
  const raw = asString(formData, key, true);
  if (!isTicketStatus(raw)) {
    throw new Error(`Invalid ${key}`);
  }
  return raw;
}

function parseEventInput(formData: FormData): EventWriteInput {
  const registrationStart = parseOptionalDate(formData, "registrationStart");
  const registrationEnd = parseOptionalDate(formData, "registrationEnd");
  if (registrationStart && registrationEnd && registrationEnd <= registrationStart) {
    throw new Error("registrationEnd must be after registrationStart");
  }

  return {
    name: asString(formData, "name", true),
    eventDate: parseOptionalDate(formData, "eventDate"),
    addressLine1: asString(formData, "addressLine1", true),
    addressLine2: asString(formData, "addressLine2") || null,
    city: asString(formData, "city", true),
    state: asString(formData, "state", true),
    country: asString(formData, "country", true),
    about: parseOptionalJson(formData, "about"),
    termsAndConditions: parseOptionalJson(formData, "termsAndConditions"),
    registrationStart,
    registrationEnd,
    status: parseEventStatus(formData, "status"),
    verificationRequired: parseBoolean(formData, "verificationRequired"),
  };
}

function parseTicketInput(formData: FormData): TicketWriteInput {
  const discountStart = parseOptionalDate(formData, "discountStart");
  const discountEnd = parseOptionalDate(formData, "discountEnd");
  if (discountStart && discountEnd && discountEnd <= discountStart) {
    throw new Error("discountEnd must be after discountStart");
  }

  const soldCount = parseOptionalInteger(formData, "soldCount");
  const quantity = parseOptionalInteger(formData, "quantity");
  if (quantity !== null && quantity <= 0) {
    throw new Error("quantity must be greater than 0");
  }
  if (soldCount !== null && soldCount < 0) {
    throw new Error("soldCount cannot be negative");
  }
  if (quantity !== null && soldCount !== null && soldCount > quantity) {
    throw new Error("soldCount cannot exceed quantity");
  }

  return {
    eventId: asString(formData, "eventId", true),
    description: parseOptionalJson(formData, "description"),
    price: parseRequiredNumber(formData, "price"),
    quantity,
    soldCount: soldCount ?? 0,
    discountStart,
    discountEnd,
    status: parseTicketStatus(formData, "status"),
  };
}

function parseCouponInput(formData: FormData): CouponWriteInput {
  const validFrom = parseOptionalDate(formData, "validFrom");
  const validUntil = parseOptionalDate(formData, "validUntil");
  if (validFrom && validUntil && validUntil <= validFrom) {
    throw new Error("validUntil must be after validFrom");
  }

  const usageLimit = parseOptionalInteger(formData, "usageLimit");
  const usedCount = parseOptionalInteger(formData, "usedCount");

  if (usageLimit !== null && usageLimit <= 0) {
    throw new Error("usageLimit must be greater than 0");
  }
  if (usedCount !== null && usedCount < 0) {
    throw new Error("usedCount cannot be negative");
  }
  if (usageLimit !== null && usedCount !== null && usedCount > usageLimit) {
    throw new Error("usedCount cannot exceed usageLimit");
  }

  return {
    eventId: asString(formData, "eventId", true),
    code: asString(formData, "code", true),
    discountType: (() => {
      const value = asString(formData, "discountType", true);
      if (!isDiscountType(value)) {
        throw new Error("Invalid discountType");
      }
      return value;
    })(),
    discountValue: parseRequiredNumber(formData, "discountValue"),
    usageLimit,
    usedCount: usedCount ?? 0,
    validFrom,
    validUntil,
    isActive: parseBoolean(formData, "isActive"),
  };
}

function parseFormFieldInput(formData: FormData): FormFieldWriteInput {
  return {
    eventId: asString(formData, "eventId", true),
    fieldName: asString(formData, "fieldName", true),
    label: asString(formData, "label", true),
    fieldType: asString(formData, "fieldType", true),
    isRequired: parseBoolean(formData, "isRequired"),
    options: parseOptionalJson(formData, "options"),
    displayOrder: parseOptionalInteger(formData, "displayOrder") ?? 0,
  };
}

function actionContext(formData: FormData) {
  const eventId = asString(formData, "eventId") || undefined;
  const includeDeleted = asString(formData, "includeDeleted") === "1";
  const paymentStatusRaw = asString(formData, "paymentStatus");
  const paymentStatus = paymentStatusRaw && isPaymentStatus(paymentStatusRaw) ? paymentStatusRaw : undefined;
  return {
    eventId,
    includeDeleted,
    paymentStatus,
  };
}

export async function createEventAction(formData: FormData) {
  const session = await ensureSession();
  const { includeDeleted, paymentStatus } = actionContext(formData);

  try {
    const eventId = await createEvent(parseEventInput(formData));
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Event created" }));
  } catch (error) {
    logger.error("createEventAction failed", {
      userId: session.sub,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to create event",
      }),
    );
  }
}

export async function updateEventAction(formData: FormData) {
  const session = await ensureSession();
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);
  if (!eventId) {
    redirect(toAdminEventsUrl({ includeDeleted, paymentStatus, error: "Invalid eventId" }));
  }

  try {
    await updateEvent({ eventId, input: parseEventInput(formData) });
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Event updated" }));
  } catch (error) {
    logger.error("updateEventAction failed", {
      userId: session.sub,
      eventId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to update event",
      }),
    );
  }
}

export async function archiveEventAction(formData: FormData) {
  const session = await ensureSession();
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);
  if (!eventId) {
    redirect(toAdminEventsUrl({ includeDeleted, paymentStatus, error: "Invalid eventId" }));
  }

  try {
    await softDeleteEvent({ eventId });
    redirect(toAdminEventsUrl({ includeDeleted: true, paymentStatus, success: "Event archived" }));
  } catch (error) {
    logger.error("archiveEventAction failed", {
      userId: session.sub,
      eventId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to archive event",
      }),
    );
  }
}

export async function restoreEventAction(formData: FormData) {
  const session = await ensureSession();
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);
  if (!eventId) {
    redirect(toAdminEventsUrl({ includeDeleted, paymentStatus, error: "Invalid eventId" }));
  }

  try {
    await restoreEvent({ eventId });
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Event restored" }));
  } catch (error) {
    logger.error("restoreEventAction failed", {
      userId: session.sub,
      eventId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        includeDeleted,
        paymentStatus,
        eventId,
        error: error instanceof Error ? error.message : "Failed to restore event",
      }),
    );
  }
}

export async function createEventTicketAction(formData: FormData) {
  const session = await ensureSession();
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);

  try {
    await createEventTicket(parseTicketInput(formData));
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Ticket created" }));
  } catch (error) {
    logger.error("createEventTicketAction failed", {
      userId: session.sub,
      eventId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to create ticket",
      }),
    );
  }
}

export async function updateEventTicketAction(formData: FormData) {
  const session = await ensureSession();
  const ticketId = asString(formData, "ticketId", true);
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);

  try {
    await updateEventTicket({ ticketId, input: parseTicketInput(formData) });
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Ticket updated" }));
  } catch (error) {
    logger.error("updateEventTicketAction failed", {
      userId: session.sub,
      eventId,
      ticketId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to update ticket",
      }),
    );
  }
}

export async function archiveEventTicketAction(formData: FormData) {
  const session = await ensureSession();
  const ticketId = asString(formData, "ticketId", true);
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);

  try {
    await softDeleteEventTicket({ ticketId });
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Ticket archived" }));
  } catch (error) {
    logger.error("archiveEventTicketAction failed", {
      userId: session.sub,
      eventId,
      ticketId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to archive ticket",
      }),
    );
  }
}

export async function createEventCouponAction(formData: FormData) {
  const session = await ensureSession();
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);

  try {
    await createEventCoupon(parseCouponInput(formData));
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Coupon created" }));
  } catch (error) {
    logger.error("createEventCouponAction failed", {
      userId: session.sub,
      eventId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to create coupon",
      }),
    );
  }
}

export async function updateEventCouponAction(formData: FormData) {
  const session = await ensureSession();
  const couponId = asString(formData, "couponId", true);
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);

  try {
    await updateEventCoupon({ couponId, input: parseCouponInput(formData) });
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Coupon updated" }));
  } catch (error) {
    logger.error("updateEventCouponAction failed", {
      userId: session.sub,
      eventId,
      couponId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to update coupon",
      }),
    );
  }
}

export async function archiveEventCouponAction(formData: FormData) {
  const session = await ensureSession();
  const couponId = asString(formData, "couponId", true);
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);

  try {
    await softDeleteEventCoupon({ couponId });
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Coupon archived" }));
  } catch (error) {
    logger.error("archiveEventCouponAction failed", {
      userId: session.sub,
      eventId,
      couponId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to archive coupon",
      }),
    );
  }
}

export async function createEventFormFieldAction(formData: FormData) {
  const session = await ensureSession();
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);

  try {
    await createEventFormField(parseFormFieldInput(formData));
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Form field created" }));
  } catch (error) {
    logger.error("createEventFormFieldAction failed", {
      userId: session.sub,
      eventId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to create form field",
      }),
    );
  }
}

export async function updateEventFormFieldAction(formData: FormData) {
  const session = await ensureSession();
  const formFieldId = asString(formData, "formFieldId", true);
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);

  try {
    await updateEventFormField({ formFieldId, input: parseFormFieldInput(formData) });
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Form field updated" }));
  } catch (error) {
    logger.error("updateEventFormFieldAction failed", {
      userId: session.sub,
      eventId,
      formFieldId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to update form field",
      }),
    );
  }
}

export async function deleteEventFormFieldAction(formData: FormData) {
  const session = await ensureSession();
  const formFieldId = asString(formData, "formFieldId", true);
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);

  try {
    await deleteEventFormField({ formFieldId });
    redirect(toAdminEventsUrl({ eventId, includeDeleted, paymentStatus, success: "Form field deleted" }));
  } catch (error) {
    logger.error("deleteEventFormFieldAction failed", {
      userId: session.sub,
      eventId,
      formFieldId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to delete form field",
      }),
    );
  }
}

export async function verifyEventRegistrationAction(formData: FormData) {
  const session = await ensureSession();
  const registrationId = asString(formData, "registrationId", true);
  const { eventId, includeDeleted, paymentStatus } = actionContext(formData);

  if (!eventId) {
    redirect(toAdminEventsUrl({ includeDeleted, paymentStatus, error: "Invalid eventId" }));
  }

  try {
    await verifyEventRegistration({ eventId, registrationId });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        success: "Registration verified",
      }),
    );
  } catch (error) {
    logger.error("verifyEventRegistrationAction failed", {
      userId: session.sub,
      eventId,
      registrationId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(
      toAdminEventsUrl({
        eventId,
        includeDeleted,
        paymentStatus,
        error: error instanceof Error ? error.message : "Failed to verify registration",
      }),
    );
  }
}
