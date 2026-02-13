export const EVENT_STATUS_VALUES = ["draft", "published", "cancelled", "completed"] as const;
export const TICKET_STATUS_VALUES = ["active", "inactive", "sold_out"] as const;
export const DISCOUNT_TYPE_VALUES = ["percentage", "flat"] as const;
export const PAYMENT_STATUS_VALUES = ["pending", "paid", "failed", "refunded"] as const;

export type EventStatus = (typeof EVENT_STATUS_VALUES)[number];
export type TicketStatus = (typeof TICKET_STATUS_VALUES)[number];
export type DiscountType = (typeof DISCOUNT_TYPE_VALUES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

function includes<T extends string>(values: readonly T[], value: string): value is T {
  return values.includes(value as T);
}

export function isEventStatus(value: string): value is EventStatus {
  return includes(EVENT_STATUS_VALUES, value);
}

export function isTicketStatus(value: string): value is TicketStatus {
  return includes(TICKET_STATUS_VALUES, value);
}

export function isDiscountType(value: string): value is DiscountType {
  return includes(DISCOUNT_TYPE_VALUES, value);
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return includes(PAYMENT_STATUS_VALUES, value);
}
