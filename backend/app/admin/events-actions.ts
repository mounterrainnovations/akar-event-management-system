"use server";

import { redirect } from "next/navigation";
import { getAuthSession, type SessionPayload } from "@/lib/auth/session";
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

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

type EventsActionContext = {
  eventId?: string;
  includeDeleted: boolean;
  paymentStatus?: PaymentStatus;
};

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

function redirectSuccess(params: {
  ctx: EventsActionContext;
  success: string;
  eventId?: string;
  includeDeleted?: boolean;
}) {
  redirect(
    toAdminEventsUrl({
      eventId: params.eventId ?? params.ctx.eventId,
      includeDeleted: params.includeDeleted ?? params.ctx.includeDeleted,
      paymentStatus: params.ctx.paymentStatus,
      success: params.success,
    }),
  );
}

function redirectError(params: {
  ctx: EventsActionContext;
  session: SessionPayload;
  action: string;
  defaultMessage: string;
  error: unknown;
  eventId?: string;
}) {
  logger.error(`${params.action} failed`, {
    userId: params.session.sub,
    eventId: params.eventId ?? params.ctx.eventId,
    message:
      params.error instanceof Error ? params.error.message : "Unknown error",
  });

  redirect(
    toAdminEventsUrl({
      eventId: params.eventId ?? params.ctx.eventId,
      includeDeleted: params.ctx.includeDeleted,
      paymentStatus: params.ctx.paymentStatus,
      error:
        params.error instanceof Error
          ? params.error.message
          : params.defaultMessage,
    }),
  );
}

function requireEventId(ctx: EventsActionContext) {
  if (!ctx.eventId) {
    redirect(
      toAdminEventsUrl({
        includeDeleted: ctx.includeDeleted,
        paymentStatus: ctx.paymentStatus,
        error: "Invalid eventId",
      }),
    );
  }
  return ctx.eventId;
}

async function getActionContext(formData: FormData) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login?error=Please+sign+in+again");
  }

  const eventId = asString(formData, "eventId") || undefined;
  const includeDeleted = asString(formData, "includeDeleted") === "1";
  const paymentStatusRaw = asString(formData, "paymentStatus");
  const paymentStatus =
    paymentStatusRaw && isPaymentStatus(paymentStatusRaw)
      ? paymentStatusRaw
      : undefined;

  return {
    session,
    ctx: {
      eventId,
      includeDeleted,
      paymentStatus,
    } satisfies EventsActionContext,
  };
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

function parseDiscountType(formData: FormData, key: string) {
  const raw = asString(formData, key, true);
  if (!isDiscountType(raw)) {
    throw new Error(`Invalid ${key}`);
  }
  return raw;
}

function parseEventInput(formData: FormData): EventWriteInput {
  const registrationStart = parseOptionalDate(formData, "registrationStart");
  const registrationEnd = parseOptionalDate(formData, "registrationEnd");
  if (
    registrationStart &&
    registrationEnd &&
    registrationEnd <= registrationStart
  ) {
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
    about: asString(formData, "about") || null,
    termsAndConditions: asString(formData, "termsAndConditions") || null,
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
    discountType: parseDiscountType(formData, "discountType"),
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

export async function createEventAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);

  try {
    const eventId = await createEvent(parseEventInput(formData));
    return redirectSuccess({ ctx, eventId, success: "Event created" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "createEventAction",
      defaultMessage: "Failed to create event",
      error,
    });
  }
}

export async function updateEventAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);
  const eventId = requireEventId(ctx);

  try {
    await updateEvent({ eventId, input: parseEventInput(formData) });
    return redirectSuccess({ ctx, eventId, success: "Event updated" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "updateEventAction",
      defaultMessage: "Failed to update event",
      eventId,
      error,
    });
  }
}

export async function archiveEventAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);
  const eventId = requireEventId(ctx);

  try {
    await softDeleteEvent({ eventId });
    return redirectSuccess({
      ctx,
      includeDeleted: true,
      success: "Event archived",
    });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "archiveEventAction",
      defaultMessage: "Failed to archive event",
      eventId,
      error,
    });
  }
}

export async function restoreEventAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);
  const eventId = requireEventId(ctx);

  try {
    await restoreEvent({ eventId });
    return redirectSuccess({ ctx, eventId, success: "Event restored" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "restoreEventAction",
      defaultMessage: "Failed to restore event",
      eventId,
      error,
    });
  }
}

export async function createEventTicketAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);

  try {
    await createEventTicket(parseTicketInput(formData));
    return redirectSuccess({ ctx, success: "Ticket created" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "createEventTicketAction",
      defaultMessage: "Failed to create ticket",
      error,
    });
  }
}

export async function updateEventTicketAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);
  const ticketId = asString(formData, "ticketId", true);

  try {
    await updateEventTicket({ ticketId, input: parseTicketInput(formData) });
    return redirectSuccess({ ctx, success: "Ticket updated" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "updateEventTicketAction",
      defaultMessage: "Failed to update ticket",
      error,
    });
  }
}

export async function archiveEventTicketAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);
  const ticketId = asString(formData, "ticketId", true);

  try {
    await softDeleteEventTicket({ ticketId });
    return redirectSuccess({ ctx, success: "Ticket archived" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "archiveEventTicketAction",
      defaultMessage: "Failed to archive ticket",
      error,
    });
  }
}

export async function createEventCouponAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);

  try {
    await createEventCoupon(parseCouponInput(formData));
    return redirectSuccess({ ctx, success: "Coupon created" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "createEventCouponAction",
      defaultMessage: "Failed to create coupon",
      error,
    });
  }
}

export async function updateEventCouponAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);
  const couponId = asString(formData, "couponId", true);

  try {
    await updateEventCoupon({ couponId, input: parseCouponInput(formData) });
    return redirectSuccess({ ctx, success: "Coupon updated" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "updateEventCouponAction",
      defaultMessage: "Failed to update coupon",
      error,
    });
  }
}

export async function archiveEventCouponAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);
  const couponId = asString(formData, "couponId", true);

  try {
    await softDeleteEventCoupon({ couponId });
    return redirectSuccess({ ctx, success: "Coupon archived" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "archiveEventCouponAction",
      defaultMessage: "Failed to archive coupon",
      error,
    });
  }
}

export async function createEventFormFieldAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);

  try {
    await createEventFormField(parseFormFieldInput(formData));
    return redirectSuccess({ ctx, success: "Form field created" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "createEventFormFieldAction",
      defaultMessage: "Failed to create form field",
      error,
    });
  }
}

export async function updateEventFormFieldAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);
  const formFieldId = asString(formData, "formFieldId", true);

  try {
    await updateEventFormField({
      formFieldId,
      input: parseFormFieldInput(formData),
    });
    return redirectSuccess({ ctx, success: "Form field updated" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "updateEventFormFieldAction",
      defaultMessage: "Failed to update form field",
      error,
    });
  }
}

export async function deleteEventFormFieldAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);
  const formFieldId = asString(formData, "formFieldId", true);

  try {
    await deleteEventFormField({ formFieldId });
    return redirectSuccess({ ctx, success: "Form field deleted" });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "deleteEventFormFieldAction",
      defaultMessage: "Failed to delete form field",
      error,
    });
  }
}

export async function verifyEventRegistrationAction(formData: FormData) {
  const { session, ctx } = await getActionContext(formData);
  const eventId = requireEventId(ctx);
  const registrationId = asString(formData, "registrationId", true);

  try {
    await verifyEventRegistration({ eventId, registrationId });
    return redirectSuccess({
      ctx,
      eventId,
      success: "Registration verified",
    });
  } catch (error) {
    return redirectError({
      ctx,
      session,
      action: "verifyEventRegistrationAction",
      defaultMessage: "Failed to verify registration",
      eventId,
      error,
    });
  }
}
