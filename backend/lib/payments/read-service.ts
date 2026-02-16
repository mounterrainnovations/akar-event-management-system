import {
  getPaymentByRegistrationId,
  getPaymentByTransactionId,
  listPayments,
  mapPaymentRow,
} from "@/lib/queries/payments";
import {
  isUuid,
  parsePaginationParams,
} from "@/lib/queries/common";
import { listEventRegistrationIdsByEventId } from "@/lib/queries/event-registrations";
import { syncRegistrationTransactions } from "@/lib/payments/transaction-status";

export function parsePaymentListPagination(searchParams: URLSearchParams) {
  return parsePaginationParams(searchParams);
}

export function assertUuid(value: string, fieldName: string) {
  const normalized = value.trim();
  if (!isUuid(normalized)) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }
  return normalized;
}

export async function listAllPayments(input: { page: number; limit: number }) {
  const result = await listPayments(input);
  return {
    page: input.page,
    limit: input.limit,
    total: result.total,
    items: result.items.map(mapPaymentRow),
  };
}

export async function listPaymentsForUser(input: {
  userId: string;
  page: number;
  limit: number;
}) {
  const result = await listPayments(input);
  return {
    page: input.page,
    limit: input.limit,
    total: result.total,
    items: result.items.map(mapPaymentRow),
  };
}

export async function listPaymentsForEvent(input: {
  eventId: string;
  page: number;
  limit: number;
}) {
  const pendingRegistrationIds = await listEventRegistrationIdsByEventId({
    eventId: input.eventId,
    paymentStatus: "pending",
  });

  const syncResults = pendingRegistrationIds.length
    ? await syncRegistrationTransactions(pendingRegistrationIds)
    : [];

  const allRegistrationIds = await listEventRegistrationIdsByEventId({
    eventId: input.eventId,
  });

  const result = await listPayments({
    page: input.page,
    limit: input.limit,
    registrationIds: allRegistrationIds,
  });

  return {
    page: input.page,
    limit: input.limit,
    total: result.total,
    syncedPendingRegistrations: syncResults,
    items: result.items.map(mapPaymentRow),
  };
}

export async function getSinglePayment(input: {
  registrationId?: string | null;
  transactionId?: string | null;
}) {
  const registrationId = input.registrationId?.trim() || "";
  const transactionId = input.transactionId?.trim() || "";

  if (!registrationId && !transactionId) {
    throw new Error("Either registrationId or transactionId is required");
  }

  if (registrationId) {
    if (!isUuid(registrationId)) {
      throw new Error("registrationId must be a valid UUID");
    }
    const data = await getPaymentByRegistrationId(registrationId);
    return data ? mapPaymentRow(data) : null;
  }

  const data = await getPaymentByTransactionId(transactionId);
  return data ? mapPaymentRow(data) : null;
}

export function parseTransactionRouteBody(body: {
  registrationId?: string;
  registrationIds?: string[];
}) {
  const one = body.registrationId?.trim();
  const many = Array.isArray(body.registrationIds)
    ? body.registrationIds.map((value) => value.trim()).filter(Boolean)
    : [];

  const registrationIds = Array.from(new Set([...(one ? [one] : []), ...many]));
  if (!registrationIds.length) {
    throw new Error("registrationId or registrationIds is required");
  }

  for (const registrationId of registrationIds) {
    if (!isUuid(registrationId)) {
      throw new Error(`registrationId must be a valid UUID: ${registrationId}`);
    }
  }

  return {
    registrationIds,
  };
}
