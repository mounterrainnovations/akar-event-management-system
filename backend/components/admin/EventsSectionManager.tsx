import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DISCOUNT_TYPE_VALUES,
  EVENT_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  TICKET_STATUS_VALUES,
  type PaymentStatus,
} from "@/lib/events/enums";
import {
  archiveEventAction,
  archiveEventCouponAction,
  archiveEventTicketAction,
  createEventAction,
  createEventCouponAction,
  createEventFormFieldAction,
  createEventTicketAction,
  deleteEventFormFieldAction,
  restoreEventAction,
  updateEventAction,
  updateEventCouponAction,
  updateEventFormFieldAction,
  updateEventTicketAction,
  verifyEventRegistrationAction,
} from "@/app/admin/events-actions";
import { getEventAdminDetail, listEventAdminSummaries } from "@/lib/events/service";

function formatDate(date: string | null) {
  if (!date) {
    return "-";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString();
}

function formatDateTimeLocal(date: string | null) {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  const hours = `${parsed.getHours()}`.padStart(2, "0");
  const minutes = `${parsed.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function jsonInputValue(value: unknown) {
  if (value === null || typeof value === "undefined") {
    return "";
  }
  return JSON.stringify(value, null, 2);
}

function keepDeletedField(includeDeleted: boolean) {
  return includeDeleted ? <input type="hidden" name="includeDeleted" value="1" /> : null;
}

function keepPaymentStatusField(paymentStatus?: PaymentStatus) {
  return paymentStatus ? <input type="hidden" name="paymentStatus" value={paymentStatus} /> : null;
}

function ActionContextFields(params: { includeDeleted: boolean; paymentStatus?: PaymentStatus }) {
  return (
    <>
      {keepDeletedField(params.includeDeleted)}
      {keepPaymentStatusField(params.paymentStatus)}
    </>
  );
}

function fieldLabel(label: string, required = false) {
  return (
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
      {required ? " *" : ""}
    </span>
  );
}

function SectionField(props: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-1 text-sm ${props.className ?? ""}`}>
      {fieldLabel(props.label, props.required)}
      {props.children}
    </label>
  );
}

function enumSelectClassName() {
  return "h-9 w-full rounded-md border bg-background px-3 text-sm";
}

type EventsSectionManagerProps = {
  selectedEventId?: string;
  includeDeleted?: boolean;
  paymentStatus?: PaymentStatus;
};

export async function EventsSectionManager({
  selectedEventId,
  includeDeleted = false,
  paymentStatus,
}: EventsSectionManagerProps) {
  const events = await listEventAdminSummaries({ includeDeleted });
  const activeEventId = selectedEventId ?? events[0]?.id;
  const selectedEvent = activeEventId
    ? await getEventAdminDetail({ eventId: activeEventId, includeDeletedEvent: true })
    : null;

  const includeDeletedQuery = includeDeleted ? "&includeDeleted=1" : "";
  const paymentStatusQuery = paymentStatus ? `&paymentStatus=${paymentStatus}` : "";

  const registrations = selectedEvent
    ? paymentStatus
      ? selectedEvent.registrations.filter((entry) => entry.paymentStatus === paymentStatus)
      : selectedEvent.registrations
    : [];

  return (
    <div className="space-y-6 p-4">
      <div className="rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold">Event Flow Baseline</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          events is the root record. event_tickets, event_coupons, event_form_fields, and
          event_registrations all attach to one event via event_id. Registrations also link to
          ticket_id and optional coupon_id. Enums are mapped from AI.md: event_status, ticket_status,
          discount_type, payment_status.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">All Events</h2>
              <p className="text-sm text-muted-foreground">Select an event to manage nested records.</p>
            </div>
            <Link
              href={`/admin?section=events${includeDeleted ? "" : "&includeDeleted=1"}${paymentStatusQuery}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {includeDeleted ? "Hide archived" : "Show archived"}
            </Link>
          </div>

          {events.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No events found. Create your first event below.
            </p>
          ) : (
            <ul className="space-y-3">
              {events.map((event) => {
                const isActive = event.id === activeEventId;
                return (
                  <li key={event.id} className="rounded-lg border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/admin?section=events&eventId=${event.id}${includeDeletedQuery}${paymentStatusQuery}`}
                          className={`font-medium ${isActive ? "text-primary" : "text-foreground"}`}
                        >
                          {event.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {event.city}, {event.state}, {event.country}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {event.status}
                          {event.deletedAt ? " (archived)" : ""}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Tickets: {event.metrics.ticketTypes}</p>
                        <p>Coupons: {event.metrics.activeCoupons}</p>
                        <p>Fields: {event.metrics.formFields}</p>
                        <p>Regs: {event.metrics.registrations}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-lg font-semibold">Create Event</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create root event record.</p>
          <form action={createEventAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <ActionContextFields includeDeleted={includeDeleted} paymentStatus={paymentStatus} />

            <SectionField label="Event Name" required>
              <Input name="name" required />
            </SectionField>
            <SectionField label="Status (event_status)" required>
              <select name="status" className={enumSelectClassName()} defaultValue="draft" required>
                {EVENT_STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </SectionField>
            <SectionField label="Event Date">
              <Input name="eventDate" type="datetime-local" />
            </SectionField>
            <SectionField label="Registration Start">
              <Input name="registrationStart" type="datetime-local" />
            </SectionField>
            <SectionField label="Registration End">
              <Input name="registrationEnd" type="datetime-local" />
            </SectionField>
            <SectionField label="Address Line 1" required>
              <Input name="addressLine1" required />
            </SectionField>
            <SectionField label="Address Line 2">
              <Input name="addressLine2" />
            </SectionField>
            <SectionField label="City" required>
              <Input name="city" required />
            </SectionField>
            <SectionField label="State" required>
              <Input name="state" required />
            </SectionField>
            <SectionField label="Country" required>
              <Input name="country" required />
            </SectionField>
            <SectionField label="Verification Required (events.verification_required)" className="md:col-span-2">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                <input type="checkbox" name="verificationRequired" />
                Require manual verification for registrations
              </label>
            </SectionField>
            <SectionField label="About (JSON)" className="md:col-span-2">
              <textarea
                name="about"
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                placeholder='{"summary":"..."}'
              />
            </SectionField>
            <SectionField label="Terms and Conditions (JSON)" className="md:col-span-2">
              <textarea
                name="termsAndConditions"
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                placeholder='{"rules":["..."]}'
              />
            </SectionField>
            <div className="md:col-span-2">
              <Button type="submit">Create Event</Button>
            </div>
          </form>
        </div>
      </div>

      {selectedEvent ? (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Manage: {selectedEvent.event.name}</h2>
              <p className="text-sm text-muted-foreground">
                Created {formatDate(selectedEvent.event.created_at)} | Event date {formatDate(selectedEvent.event.event_date)}
              </p>
              <p className="text-sm text-muted-foreground">
                Verification Required: {selectedEvent.event.verification_required ? "Yes" : "No"}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedEvent.event.deleted_at ? (
                <form action={restoreEventAction}>
                  <input type="hidden" name="eventId" value={selectedEvent.event.id} />
                  <ActionContextFields includeDeleted={includeDeleted} paymentStatus={paymentStatus} />
                  <Button type="submit" variant="outline">
                    Restore Event
                  </Button>
                </form>
              ) : (
                <form action={archiveEventAction}>
                  <input type="hidden" name="eventId" value={selectedEvent.event.id} />
                  <ActionContextFields includeDeleted={includeDeleted} paymentStatus={paymentStatus} />
                  <Button type="submit" variant="destructive">
                    Archive Event
                  </Button>
                </form>
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border bg-background p-3 text-sm md:grid-cols-5">
            <p>Registrations: {selectedEvent.analytics.registrations}</p>
            <p>Paid: {selectedEvent.analytics.paidRegistrations}</p>
            <p>Pending/Other: {selectedEvent.analytics.pendingRegistrations}</p>
            <p>Total Qty: {selectedEvent.analytics.totalQuantity}</p>
            <p>Revenue: {selectedEvent.analytics.totalRevenue.toFixed(2)}</p>
          </div>

          {!selectedEvent.event.deleted_at ? (
            <form action={updateEventAction} className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
              <input type="hidden" name="eventId" value={selectedEvent.event.id} />
              <ActionContextFields includeDeleted={includeDeleted} paymentStatus={paymentStatus} />

              <SectionField label="Event Name" required>
                <Input name="name" defaultValue={selectedEvent.event.name} required />
              </SectionField>
              <SectionField label="Status (event_status)" required>
                <select
                  name="status"
                  className={enumSelectClassName()}
                  defaultValue={selectedEvent.event.status}
                  required
                >
                  {EVENT_STATUS_VALUES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </SectionField>
              <SectionField label="Event Date">
                <Input
                  name="eventDate"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocal(selectedEvent.event.event_date)}
                />
              </SectionField>
              <SectionField label="Registration Start">
                <Input
                  name="registrationStart"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocal(selectedEvent.event.registration_start)}
                />
              </SectionField>
              <SectionField label="Registration End">
                <Input
                  name="registrationEnd"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocal(selectedEvent.event.registration_end)}
                />
              </SectionField>
              <SectionField label="Address Line 1" required>
                <Input name="addressLine1" defaultValue={selectedEvent.event.address_line_1} required />
              </SectionField>
              <SectionField label="Address Line 2">
                <Input name="addressLine2" defaultValue={selectedEvent.event.address_line_2 ?? ""} />
              </SectionField>
              <SectionField label="City" required>
                <Input name="city" defaultValue={selectedEvent.event.city} required />
              </SectionField>
              <SectionField label="State" required>
                <Input name="state" defaultValue={selectedEvent.event.state} required />
              </SectionField>
              <SectionField label="Country" required>
                <Input name="country" defaultValue={selectedEvent.event.country} required />
              </SectionField>
              <SectionField label="Verification Required (events.verification_required)" className="md:col-span-2">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                  <input
                    type="checkbox"
                    name="verificationRequired"
                    defaultChecked={selectedEvent.event.verification_required}
                  />
                  Require manual verification for registrations
                </label>
              </SectionField>
              <SectionField label="About (JSON)" className="md:col-span-2">
                <textarea
                  name="about"
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                  defaultValue={jsonInputValue(selectedEvent.event.about)}
                />
              </SectionField>
              <SectionField label="Terms and Conditions (JSON)" className="md:col-span-2">
                <textarea
                  name="termsAndConditions"
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                  defaultValue={jsonInputValue(selectedEvent.event.terms_and_conditions)}
                />
              </SectionField>
              <div className="md:col-span-2">
                <Button type="submit">Update Event</Button>
              </div>
            </form>
          ) : (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Event is archived. Restore to allow edits and adding child records.
            </p>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-base font-semibold">Tickets</h3>

              {!selectedEvent.event.deleted_at && (
                <form action={createEventTicketAction} className="grid gap-2 rounded-lg border p-3 md:grid-cols-2">
                  <input type="hidden" name="eventId" value={selectedEvent.event.id} />
                  <ActionContextFields includeDeleted={includeDeleted} paymentStatus={paymentStatus} />

                  <SectionField label="Status (ticket_status)" required>
                    <select name="status" className={enumSelectClassName()} defaultValue="active" required>
                      {TICKET_STATUS_VALUES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </SectionField>
                  <SectionField label="Price" required>
                    <Input name="price" type="number" min="0" step="0.01" required />
                  </SectionField>
                  <SectionField label="Quantity">
                    <Input name="quantity" type="number" min="1" step="1" />
                  </SectionField>
                  <SectionField label="Sold Count">
                    <Input name="soldCount" type="number" min="0" step="1" defaultValue={0} />
                  </SectionField>
                  <SectionField label="Discount Start">
                    <Input name="discountStart" type="datetime-local" />
                  </SectionField>
                  <SectionField label="Discount End">
                    <Input name="discountEnd" type="datetime-local" />
                  </SectionField>
                  <SectionField label="Description (JSON)" className="md:col-span-2">
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                      placeholder='{"title":"VIP"}'
                    />
                  </SectionField>
                  <div className="md:col-span-2">
                    <Button type="submit">Add Ticket</Button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {selectedEvent.tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tickets.</p>
                ) : (
                  selectedEvent.tickets.map((ticket) => (
                    <form key={ticket.id} action={updateEventTicketAction} className="space-y-2 rounded-lg border p-3">
                      <input type="hidden" name="eventId" value={selectedEvent.event.id} />
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <ActionContextFields includeDeleted={includeDeleted} paymentStatus={paymentStatus} />

                      <div className="grid gap-2 md:grid-cols-2">
                        <SectionField label="Status (ticket_status)" required>
                          <select
                            name="status"
                            className={enumSelectClassName()}
                            defaultValue={ticket.status}
                            required
                          >
                            {TICKET_STATUS_VALUES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </SectionField>
                        <SectionField label="Price" required>
                          <Input name="price" type="number" min="0" step="0.01" defaultValue={ticket.price} required />
                        </SectionField>
                        <SectionField label="Quantity">
                          <Input name="quantity" type="number" min="1" step="1" defaultValue={ticket.quantity ?? ""} />
                        </SectionField>
                        <SectionField label="Sold Count">
                          <Input name="soldCount" type="number" min="0" step="1" defaultValue={ticket.soldCount} />
                        </SectionField>
                        <SectionField label="Discount Start">
                          <Input
                            name="discountStart"
                            type="datetime-local"
                            defaultValue={formatDateTimeLocal(ticket.discountStart)}
                          />
                        </SectionField>
                        <SectionField label="Discount End">
                          <Input
                            name="discountEnd"
                            type="datetime-local"
                            defaultValue={formatDateTimeLocal(ticket.discountEnd)}
                          />
                        </SectionField>
                      </div>

                      <SectionField label="Description (JSON)">
                        <textarea
                          name="description"
                          rows={3}
                          className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                          defaultValue={jsonInputValue(ticket.description)}
                        />
                      </SectionField>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={Boolean(ticket.deletedAt) || Boolean(selectedEvent.event.deleted_at)}
                        >
                          Update
                        </Button>
                        {!ticket.deletedAt && !selectedEvent.event.deleted_at ? (
                          <button
                            type="submit"
                            formAction={archiveEventTicketAction}
                            className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground"
                          >
                            Archive
                          </button>
                        ) : (
                          <span className="self-center text-xs text-muted-foreground">Archived</span>
                        )}
                      </div>
                    </form>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-base font-semibold">Coupons</h3>

              {!selectedEvent.event.deleted_at && (
                <form action={createEventCouponAction} className="grid gap-2 rounded-lg border p-3 md:grid-cols-2">
                  <input type="hidden" name="eventId" value={selectedEvent.event.id} />
                  <ActionContextFields includeDeleted={includeDeleted} paymentStatus={paymentStatus} />

                  <SectionField label="Code" required>
                    <Input name="code" required />
                  </SectionField>
                  <SectionField label="Discount Type (discount_type)" required>
                    <select name="discountType" className={enumSelectClassName()} defaultValue="percentage" required>
                      {DISCOUNT_TYPE_VALUES.map((discountType) => (
                        <option key={discountType} value={discountType}>
                          {discountType}
                        </option>
                      ))}
                    </select>
                  </SectionField>
                  <SectionField label="Discount Value" required>
                    <Input name="discountValue" type="number" min="0.01" step="0.01" required />
                  </SectionField>
                  <SectionField label="Usage Limit">
                    <Input name="usageLimit" type="number" min="1" step="1" />
                  </SectionField>
                  <SectionField label="Used Count">
                    <Input name="usedCount" type="number" min="0" step="1" defaultValue={0} />
                  </SectionField>
                  <SectionField label="Valid From">
                    <Input name="validFrom" type="datetime-local" />
                  </SectionField>
                  <SectionField label="Valid Until">
                    <Input name="validUntil" type="datetime-local" />
                  </SectionField>
                  <SectionField label="Active Flag">
                    <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                      <input type="checkbox" name="isActive" defaultChecked />
                      Active
                    </label>
                  </SectionField>
                  <div className="md:col-span-2">
                    <Button type="submit">Add Coupon</Button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {selectedEvent.coupons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No coupons.</p>
                ) : (
                  selectedEvent.coupons.map((coupon) => (
                    <form key={coupon.id} action={updateEventCouponAction} className="space-y-2 rounded-lg border p-3">
                      <input type="hidden" name="eventId" value={selectedEvent.event.id} />
                      <input type="hidden" name="couponId" value={coupon.id} />
                      <ActionContextFields includeDeleted={includeDeleted} paymentStatus={paymentStatus} />

                      <div className="grid gap-2 md:grid-cols-2">
                        <SectionField label="Code" required>
                          <Input name="code" defaultValue={coupon.code} required />
                        </SectionField>
                        <SectionField label="Discount Type (discount_type)" required>
                          <select
                            name="discountType"
                            className={enumSelectClassName()}
                            defaultValue={coupon.discountType}
                            required
                          >
                            {DISCOUNT_TYPE_VALUES.map((discountType) => (
                              <option key={discountType} value={discountType}>
                                {discountType}
                              </option>
                            ))}
                          </select>
                        </SectionField>
                        <SectionField label="Discount Value" required>
                          <Input
                            name="discountValue"
                            type="number"
                            min="0.01"
                            step="0.01"
                            defaultValue={coupon.discountValue}
                            required
                          />
                        </SectionField>
                        <SectionField label="Usage Limit">
                          <Input
                            name="usageLimit"
                            type="number"
                            min="1"
                            step="1"
                            defaultValue={coupon.usageLimit ?? ""}
                          />
                        </SectionField>
                        <SectionField label="Used Count">
                          <Input name="usedCount" type="number" min="0" step="1" defaultValue={coupon.usedCount} />
                        </SectionField>
                        <SectionField label="Valid From">
                          <Input
                            name="validFrom"
                            type="datetime-local"
                            defaultValue={formatDateTimeLocal(coupon.validFrom)}
                          />
                        </SectionField>
                        <SectionField label="Valid Until">
                          <Input
                            name="validUntil"
                            type="datetime-local"
                            defaultValue={formatDateTimeLocal(coupon.validUntil)}
                          />
                        </SectionField>
                        <SectionField label="Active Flag">
                          <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                            <input type="checkbox" name="isActive" defaultChecked={coupon.isActive} />
                            Active
                          </label>
                        </SectionField>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={Boolean(coupon.deletedAt) || Boolean(selectedEvent.event.deleted_at)}
                        >
                          Update
                        </Button>
                        {!coupon.deletedAt && !selectedEvent.event.deleted_at ? (
                          <button
                            type="submit"
                            formAction={archiveEventCouponAction}
                            className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground"
                          >
                            Archive
                          </button>
                        ) : (
                          <span className="self-center text-xs text-muted-foreground">Archived</span>
                        )}
                      </div>
                    </form>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-base font-semibold">Form Fields</h3>

              {!selectedEvent.event.deleted_at && (
                <form action={createEventFormFieldAction} className="grid gap-2 rounded-lg border p-3 md:grid-cols-2">
                  <input type="hidden" name="eventId" value={selectedEvent.event.id} />
                  <ActionContextFields includeDeleted={includeDeleted} paymentStatus={paymentStatus} />

                  <SectionField label="Field Name" required>
                    <Input name="fieldName" required />
                  </SectionField>
                  <SectionField label="Label" required>
                    <Input name="label" required />
                  </SectionField>
                  <SectionField label="Field Type" required>
                    <Input name="fieldType" required />
                  </SectionField>
                  <SectionField label="Display Order">
                    <Input name="displayOrder" type="number" step="1" />
                  </SectionField>
                  <SectionField label="Required Flag">
                    <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                      <input type="checkbox" name="isRequired" />
                      Required
                    </label>
                  </SectionField>
                  <SectionField label="Options (JSON)" className="md:col-span-2">
                    <textarea
                      name="options"
                      rows={3}
                      className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                      placeholder='["Option 1","Option 2"]'
                    />
                  </SectionField>
                  <div className="md:col-span-2">
                    <Button type="submit">Add Form Field</Button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {selectedEvent.formFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No dynamic fields.</p>
                ) : (
                  selectedEvent.formFields.map((field) => (
                    <form key={field.id} action={updateEventFormFieldAction} className="space-y-2 rounded-lg border p-3">
                      <input type="hidden" name="eventId" value={selectedEvent.event.id} />
                      <input type="hidden" name="formFieldId" value={field.id} />
                      <ActionContextFields includeDeleted={includeDeleted} paymentStatus={paymentStatus} />

                      <div className="grid gap-2 md:grid-cols-2">
                        <SectionField label="Field Name" required>
                          <Input name="fieldName" defaultValue={field.fieldName} required />
                        </SectionField>
                        <SectionField label="Label" required>
                          <Input name="label" defaultValue={field.label} required />
                        </SectionField>
                        <SectionField label="Field Type" required>
                          <Input name="fieldType" defaultValue={field.fieldType} required />
                        </SectionField>
                        <SectionField label="Display Order">
                          <Input name="displayOrder" type="number" step="1" defaultValue={field.displayOrder} />
                        </SectionField>
                        <SectionField label="Required Flag" className="md:col-span-2">
                          <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                            <input type="checkbox" name="isRequired" defaultChecked={field.isRequired} />
                            Required
                          </label>
                        </SectionField>
                      </div>

                      <SectionField label="Options (JSON)">
                        <textarea
                          name="options"
                          rows={3}
                          className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                          defaultValue={jsonInputValue(field.options)}
                        />
                      </SectionField>

                      <div className="flex gap-2">
                        <Button type="submit" variant="outline" disabled={Boolean(selectedEvent.event.deleted_at)}>
                          Update
                        </Button>
                        {!selectedEvent.event.deleted_at && (
                          <button
                            type="submit"
                            formAction={deleteEventFormFieldAction}
                            className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </form>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold">Registrations (View only)</h3>
                <form method="get" className="flex items-end gap-2">
                  <input type="hidden" name="section" value="events" />
                  <input type="hidden" name="eventId" value={selectedEvent.event.id} />
                  {includeDeleted ? <input type="hidden" name="includeDeleted" value="1" /> : null}
                  <label className="space-y-1 text-sm">
                    {fieldLabel("Payment Status Filter")}
                    <select
                      name="paymentStatus"
                      className={enumSelectClassName()}
                      defaultValue={paymentStatus ?? ""}
                    >
                      <option value="">all</option>
                      {PAYMENT_STATUS_VALUES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button type="submit" variant="outline">
                    Apply
                  </Button>
                </form>
              </div>

              {registrations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No registrations for selected filter.</p>
              ) : (
                <ul className="space-y-2">
                  {registrations.map((registration) => (
                    <li key={registration.id} className="rounded-lg border bg-background p-3 text-sm">
                      <p className="font-medium">#{registration.id}</p>
                      <p className="text-muted-foreground">
                        Ticket ID: {registration.ticketId} | User ID: {registration.userId ?? "guest"}
                      </p>
                      <p className="text-muted-foreground">
                        Coupon ID: {registration.couponId ?? "none"} | Quantity: {registration.quantity}
                      </p>
                      <p className="text-muted-foreground">
                        Total Amount: {registration.totalAmount.toFixed(2)} | Discount Amount: {registration.discountAmount.toFixed(2)} | Final Amount: {registration.finalAmount.toFixed(2)}
                      </p>
                      <p className="text-muted-foreground">
                        Payment Status (payment_status): {registration.paymentStatus} | Created At: {formatDate(registration.createdAt)}
                      </p>
                      <p className="text-muted-foreground">
                        Verification Status (event_registrations.is_verified):{" "}
                        {registration.isVerified === null
                          ? "null"
                          : registration.isVerified
                            ? "true"
                            : "false"}
                      </p>
                      {selectedEvent.event.verification_required && registration.isVerified === false ? (
                        <form action={verifyEventRegistrationAction} className="mt-2">
                          <input type="hidden" name="eventId" value={selectedEvent.event.id} />
                          <input type="hidden" name="registrationId" value={registration.id} />
                          <ActionContextFields includeDeleted={includeDeleted} paymentStatus={paymentStatus} />
                          <Button type="submit" variant="outline">
                            Verify Registrant
                          </Button>
                        </form>
                      ) : null}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-primary">View Form Response (JSON)</summary>
                        <pre className="mt-2 overflow-x-auto rounded-md border bg-muted p-2 text-xs">
                          {jsonInputValue(registration.formResponse)}
                        </pre>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
          Select an event to manage tickets, coupons, form fields, and registrations.
        </div>
      )}
    </div>
  );
}
