import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

type EventRow = {
  id: string;
  name: string;
  base_event_banner: string | null;
  event_date: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  country: string;
  about: string | null;
  terms_and_conditions: string | null;
  registration_start: string | null;
  registration_end: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  verification_required: boolean;
};

type TicketRow = {
  id: string;
  event_id: string;
  description: JsonValue | null;
  price: string;
  quantity: number | null;
  sold_count: number;
  discount_start: string | null;
  discount_end: string | null;
  status: string;
  max_qty_per_person: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type CouponRow = {
  id: string;
  event_id: string;
  code: string;
  discount_value: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type FormFieldRow = {
  id: string;
  event_id: string;
  field_name: string;
  label: string;
  field_type: string;
  is_required: boolean;
  options: JsonValue | null;
  display_order: number;
  created_at: string;
};

type BundleOfferRow = {
  id: string;
  event_id: string;
  name: string;
  buy_quantity: number;
  get_quantity: number;
  offer_type: string;
  applicable_ticket_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

type RegistrationRow = {
  id: string;
  event_id: string;
  user_id: string | null;
  coupon_id: string | null;
  tickets_bought: number;
  total_amount: string;
  final_amount: string;
  payment_status: string;
  form_response: JsonValue;
  created_at: string;
  is_verified: boolean | null;
};

export type EventSummary = {
  id: string;
  name: string;
  bannerUrl: string | null;
  status: string;
  eventDate: string | null;
  registrationStart: string | null;
  registrationEnd: string | null;
  city: string;
  state: string;
  country: string;
  deletedAt: string | null;
  verificationRequired: boolean;
  createdAt: string;
  metrics: {
    ticketTypes: number;
    activeCoupons: number;
    formFields: number;
    registrations: number;
    totalTicketsSold: number;
    grossRevenue: number;
  };
};

export type BookingDetail = {
  id: string;
  eventId: string;
  eventName: string;
  ticketId: string;
  ticketName: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userPhone: string | null;
  couponId: string | null;
  couponCode: string | null;
  quantity: number;
  totalAmount: number;
  finalAmount: number;
  paymentStatus: string;
  formResponse: any;
  createdAt: string;
  isVerified: boolean | null;
};

export type EventTicket = {
  id: string;
  description: JsonValue | null;
  price: number;
  quantity: number | null;
  soldCount: number;
  discountStart: string | null;
  discountEnd: string | null;
  status: string;
  maxQuantityPerPerson: number;
  createdAt: string;
  deletedAt: string | null;
};

export type EventCoupon = {
  id: string;
  code: string;
  discountValue: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  deletedAt: string | null;
};

export type EventFormField = {
  id: string;
  fieldName: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  options: JsonValue | null;
  displayOrder: number;
  answer: string | null;
  createdAt: string;
};

export type EventBundleOffer = {
  id: string;
  name: string;
  buyQuantity: number;
  getQuantity: number;
  offerType: "same_tier" | "cross_tier";
  applicableTicketIds: string[] | null;
  createdAt: string;
};

export type EventRegistration = {
  id: string;
  userId: string | null;
  couponId: string | null;
  quantity: number;
  totalAmount: number;
  finalAmount: number;
  paymentStatus: string;
  isVerified: boolean | null;
  formResponse: JsonValue;
  createdAt: string;
};

export type EventDetail = {
  event: EventRow;
  tickets: EventTicket[];
  coupons: EventCoupon[];
  formFields: EventFormField[];
  bundleOffers: EventBundleOffer[];
  registrations: EventRegistration[];
  analytics: {
    registrations: number;
    paidRegistrations: number;
    pendingRegistrations: number;
    totalQuantity: number;
    totalRevenue: number;
  };
};

export type EventWriteInput = {
  name: string;
  baseEventBanner?: string | null;
  eventDate?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  about?: string | null;
  termsAndConditions?: string | null;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  status?: string | null;
  verificationRequired?: boolean;
  coupons?: Omit<CouponWriteInput, "eventId">[];
  formFields?: Omit<FormFieldWriteInput, "eventId">[];
  tickets?: Omit<TicketWriteInput, "eventId">[];
  bundleOffers?: Omit<BundleOfferWriteInput, "eventId">[];
};

export type TicketWriteInput = {
  eventId: string;
  description?: JsonValue | null;
  price: number;
  quantity?: number | null;
  soldCount?: number;
  discountStart?: string | null;
  discountEnd?: string | null;
  status?: string | null;
  maxQuantityPerPerson?: number;
};

export type CouponWriteInput = {
  eventId: string;
  code: string;
  discountValue: number;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive?: boolean;
};

export type FormFieldWriteInput = {
  eventId: string;
  fieldName: string;
  label: string;
  fieldType: string;
  isRequired?: boolean;
  options?: JsonValue | null;
  displayOrder?: number;
  answer?: string | null;
};

export type BundleOfferWriteInput = {
  eventId: string;
  name: string;
  buyQuantity: number;
  getQuantity: number;
  offerType: "same_tier" | "cross_tier";
  applicableTicketIds?: string[] | null;
};

const logger = getLogger("events-service");

const EVENT_SELECT_FIELDS =
  "id,name,base_event_banner,event_date,address_line_1,address_line_2,city,state,country,about,terms_and_conditions,registration_start,registration_end,status,created_at,updated_at,deleted_at,verification_required";
const TICKET_SELECT_FIELDS =
  "id,event_id,description,price,quantity,sold_count,discount_start,discount_end,status,created_at,updated_at,deleted_at,max_qty_per_person";
const COUPON_SELECT_FIELDS =
  "id,event_id,code,discount_value,valid_from,valid_until,is_active,created_at,updated_at,deleted_at";
const FORM_FIELD_SELECT_FIELDS =
  "id,event_id,field_name,label,field_type,is_required,options,display_order,created_at,answer";
const BUNDLE_OFFER_SELECT_FIELDS =
  "id,event_id,name,buy_quantity,get_quantity,offer_type,applicable_ticket_ids,created_at,updated_at";
const REGISTRATION_SELECT_FIELDS =
  "id,event_id,user_id,coupon_id,tickets_bought,total_amount,final_amount,payment_status,form_response,created_at,is_verified";

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

function mapTicket(row: TicketRow): EventTicket {
  return {
    id: row.id,
    description: row.description,
    price: toNumber(row.price),
    quantity: row.quantity,
    soldCount: row.sold_count,
    discountStart: row.discount_start,
    discountEnd: row.discount_end,
    status: row.status,
    maxQuantityPerPerson: row.max_qty_per_person || 1,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

function mapCoupon(row: CouponRow): EventCoupon {
  return {
    id: row.id,
    code: row.code,
    discountValue: toNumber(row.discount_value),
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    isActive: row.is_active,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

function mapFormField(
  row: FormFieldRow & { answer?: string | null },
): EventFormField & { answer?: string | null } {
  return {
    id: row.id,
    fieldName: row.field_name,
    label: row.label,
    fieldType: row.field_type,
    isRequired: row.is_required,
    options: row.options,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    answer: row.answer ?? null,
  };
}

function mapRegistration(row: RegistrationRow): EventRegistration {
  return {
    id: row.id,
    userId: row.user_id,
    couponId: row.coupon_id,
    quantity: row.tickets_bought,
    totalAmount: toNumber(row.total_amount),
    finalAmount: toNumber(row.final_amount),
    paymentStatus: row.payment_status,
    isVerified: row.is_verified,
    formResponse: row.form_response,
    createdAt: row.created_at,
  };
}

function mapEventWriteInput(input: EventWriteInput) {
  return {
    name: input.name,
    base_event_banner: input.baseEventBanner ?? null,
    event_date: input.eventDate ?? null,
    address_line_1: input.addressLine1,
    address_line_2: input.addressLine2 ?? null,
    city: input.city,
    state: input.state,
    country: input.country,
    about: input.about ?? null,
    terms_and_conditions: input.termsAndConditions ?? null,
    registration_start: input.registrationStart ?? null,
    registration_end: input.registrationEnd ?? null,
    verification_required: input.verificationRequired ?? false,
    ...(input.status ? { status: input.status } : {}),
  };
}

function mapTicketWriteInput(input: TicketWriteInput, includeEventId: boolean) {
  return {
    ...(includeEventId ? { event_id: input.eventId } : {}),
    description: input.description ?? null,
    price: input.price,
    quantity: input.quantity ?? null,
    sold_count: input.soldCount ?? 0,
    discount_start: input.discountStart ?? null,
    discount_end: input.discountEnd ?? null,
    ...(input.status ? { status: input.status } : {}),
    max_qty_per_person: input.maxQuantityPerPerson ?? 1,
  };
}

function mapCouponWriteInput(input: CouponWriteInput, includeEventId: boolean) {
  return {
    ...(includeEventId ? { event_id: input.eventId } : {}),
    code: input.code,
    discount_value: input.discountValue,
    valid_from: input.validFrom ?? null,
    valid_until: input.validUntil ?? null,
    is_active: input.isActive ?? true,
  };
}

function mapFormFieldWriteInput(
  input: FormFieldWriteInput,
  includeEventId: boolean,
) {
  return {
    ...(includeEventId ? { event_id: input.eventId } : {}),
    field_name: input.fieldName,
    label: input.label,
    field_type: input.fieldType,
    is_required: input.isRequired ?? false,
    options: input.options ?? null,
    display_order: input.displayOrder ?? 0,
    answer: input.answer ?? null,
  };
}

function mapBundleOffer(row: BundleOfferRow): EventBundleOffer {
  return {
    id: row.id,
    name: row.name,
    buyQuantity: row.buy_quantity,
    getQuantity: row.get_quantity,
    offerType: row.offer_type as "same_tier" | "cross_tier",
    applicableTicketIds: row.applicable_ticket_ids,
    createdAt: row.created_at,
  };
}

function mapBundleOfferWriteInput(
  input: BundleOfferWriteInput,
  includeEventId: boolean,
) {
  return {
    ...(includeEventId ? { event_id: input.eventId } : {}),
    name: input.name,
    buy_quantity: input.buyQuantity,
    get_quantity: input.getQuantity,
    offer_type: input.offerType,
    applicable_ticket_ids: input.applicableTicketIds ?? null,
  };
}

async function syncRegistrationVerificationMode(params: {
  eventId: string;
  verificationRequired: boolean;
}) {
  const { eventId, verificationRequired } = params;
  const supabase = createSupabaseAdminClient();

  if (verificationRequired) {
    const { error } = await supabase
      .from("event_registrations")
      .update({ is_verified: false })
      .eq("event_id", eventId)
      .is("is_verified", null);

    if (error) {
      logger.error(
        "Failed to enforce default verification=false for registrations",
        {
          eventId,
          message: error.message,
        },
      );
      throw new Error("Unable to enforce registration verification defaults");
    }
    return;
  }

  const { error } = await supabase
    .from("event_registrations")
    .update({ is_verified: null })
    .eq("event_id", eventId)
    .not("is_verified", "is", null);

  if (error) {
    logger.error(
      "Failed to reset registration verification when event verification disabled",
      {
        eventId,
        message: error.message,
      },
    );
    throw new Error("Unable to reset registration verification state");
  }
}

export async function listEventAdminSummaries(params?: {
  includeDeleted?: boolean;
}) {
  const includeDeleted = params?.includeDeleted ?? false;
  const supabase = createSupabaseAdminClient();

  let eventQuery = supabase
    .from("events")
    .select(EVENT_SELECT_FIELDS)
    .order("created_at", { ascending: false });

  if (!includeDeleted) {
    eventQuery = eventQuery.is("deleted_at", null);
  }

  const [
    { data: events, error: eventError },
    { data: tickets, error: ticketError },
    { data: coupons, error: couponError },
    { data: formFields, error: fieldError },
    { data: registrations, error: registrationError },
  ] = await Promise.all([
    eventQuery.returns<EventRow[]>(),
    supabase
      .from("event_tickets")
      .select("id,event_id,quantity,sold_count,deleted_at")
      .is("deleted_at", null)
      .returns<
        Array<
          Pick<
            TicketRow,
            "id" | "event_id" | "quantity" | "sold_count" | "deleted_at"
          >
        >
      >(),
    supabase
      .from("event_coupons")
      .select("id,event_id,is_active,deleted_at")
      .is("deleted_at", null)
      .returns<
        Array<Pick<CouponRow, "id" | "event_id" | "is_active" | "deleted_at">>
      >(),
    supabase
      .from("event_form_fields")
      .select("id,event_id")
      .returns<Array<Pick<FormFieldRow, "id" | "event_id">>>(),
    supabase
      .from("event_registrations")
      .select("id,event_id,tickets_bought,final_amount,payment_status")
      .returns<
        Array<
          Pick<
            RegistrationRow,
            | "id"
            | "event_id"
            | "tickets_bought"
            | "final_amount"
            | "payment_status"
          >
        >
      >(),
  ]);

  if (
    eventError ||
    ticketError ||
    couponError ||
    fieldError ||
    registrationError
  ) {
    logger.error("Failed to list event summaries", {
      eventError: eventError?.message,
      ticketError: ticketError?.message,
      couponError: couponError?.message,
      fieldError: fieldError?.message,
      registrationError: registrationError?.message,
    });
    throw new Error("Unable to load events");
  }

  const ticketByEvent = new Map<string, Array<(typeof tickets)[number]>>();
  (tickets ?? []).forEach((ticket) => {
    const list = ticketByEvent.get(ticket.event_id) ?? [];
    list.push(ticket);
    ticketByEvent.set(ticket.event_id, list);
  });

  const couponByEvent = new Map<string, Array<(typeof coupons)[number]>>();
  (coupons ?? []).forEach((coupon) => {
    const list = couponByEvent.get(coupon.event_id) ?? [];
    list.push(coupon);
    couponByEvent.set(coupon.event_id, list);
  });

  const formFieldByEvent = new Map<
    string,
    Array<(typeof formFields)[number]>
  >();
  (formFields ?? []).forEach((field) => {
    const list = formFieldByEvent.get(field.event_id) ?? [];
    list.push(field);
    formFieldByEvent.set(field.event_id, list);
  });

  const registrationByEvent = new Map<
    string,
    Array<(typeof registrations)[number]>
  >();
  (registrations ?? []).forEach((registration) => {
    const list = registrationByEvent.get(registration.event_id) ?? [];
    list.push(registration);
    registrationByEvent.set(registration.event_id, list);
  });

  return (events ?? []).map((event) => {
    const eventTickets = ticketByEvent.get(event.id) ?? [];
    const eventCoupons = couponByEvent.get(event.id) ?? [];
    const eventFormFields = formFieldByEvent.get(event.id) ?? [];
    const eventRegistrations = registrationByEvent.get(event.id) ?? [];

    return {
      id: event.id,
      name: event.name,
      bannerUrl: event.base_event_banner,
      status: event.status,
      eventDate: event.event_date,
      registrationStart: event.registration_start,
      registrationEnd: event.registration_end,
      city: event.city,
      state: event.state,
      country: event.country,
      deletedAt: event.deleted_at,
      verificationRequired: event.verification_required,
      createdAt: event.created_at,
      metrics: {
        ticketTypes: eventTickets.length,
        activeCoupons: eventCoupons.filter((coupon) => coupon.is_active).length,
        formFields: eventFormFields.length,
        registrations: eventRegistrations.length,
        totalTicketsSold: eventTickets.reduce(
          (acc, ticket) => acc + ticket.sold_count,
          0,
        ),
        grossRevenue: eventRegistrations.reduce(
          (acc, registration) => acc + toNumber(registration.final_amount),
          0,
        ),
      },
    } satisfies EventSummary;
  });
}

export async function getEventAdminDetail(params: {
  eventId: string;
  includeDeletedEvent?: boolean;
}) {
  const { eventId, includeDeletedEvent = true } = params;
  const supabase = createSupabaseAdminClient();

  let eventQuery = supabase
    .from("events")
    .select(EVENT_SELECT_FIELDS)
    .eq("id", eventId);

  if (!includeDeletedEvent) {
    eventQuery = eventQuery.is("deleted_at", null);
  }

  const { data: event, error: eventError } =
    await eventQuery.maybeSingle<EventRow>();
  if (eventError) {
    logger.error("Failed to load event detail", {
      eventId,
      message: eventError.message,
    });
    throw new Error("Unable to load event details");
  }
  if (!event) {
    return null;
  }

  const [
    { data: tickets, error: ticketError },
    { data: coupons, error: couponError },
    { data: formFields, error: fieldError },
    { data: bundleOffers, error: bundleOfferError },
  ] = await Promise.all([
    supabase
      .from("event_tickets")
      .select(TICKET_SELECT_FIELDS)
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .returns<TicketRow[]>(),
    supabase
      .from("event_coupons")
      .select(COUPON_SELECT_FIELDS)
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .returns<CouponRow[]>(),
    supabase
      .from("event_form_fields")
      .select(FORM_FIELD_SELECT_FIELDS)
      .eq("event_id", eventId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<(FormFieldRow & { image_link?: string | null })[]>(),
    supabase
      .from("event_bundle_offers")
      .select(BUNDLE_OFFER_SELECT_FIELDS)
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .returns<BundleOfferRow[]>(),
  ]);

  await syncRegistrationVerificationMode({
    eventId,
    verificationRequired: event.verification_required,
  });

  const { data: registrations, error: registrationError } = await supabase
    .from("event_registrations")
    .select(REGISTRATION_SELECT_FIELDS)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .returns<RegistrationRow[]>();

  if (
    ticketError ||
    couponError ||
    fieldError ||
    registrationError ||
    bundleOfferError
  ) {
    logger.error("Failed to load related event entities", {
      eventId,
      ticketError: ticketError?.message,
      couponError: couponError?.message,
      fieldError: fieldError?.message,
      registrationError: registrationError?.message,
      bundleOfferError: bundleOfferError?.message,
    });
    throw new Error("Unable to load event related records");
  }

  const mappedRegistrations = (registrations ?? []).map(mapRegistration);

  return {
    event,
    tickets: (tickets ?? []).map(mapTicket),
    coupons: (coupons ?? []).map(mapCoupon),
    formFields: (formFields ?? []).map(mapFormField),
    bundleOffers: (bundleOffers ?? []).map(mapBundleOffer),
    registrations: mappedRegistrations,
    analytics: {
      registrations: mappedRegistrations.length,
      paidRegistrations: mappedRegistrations.filter(
        (entry) => entry.paymentStatus === "paid",
      ).length,
      pendingRegistrations: mappedRegistrations.filter(
        (entry) => entry.paymentStatus !== "paid",
      ).length,
      totalQuantity: mappedRegistrations.reduce(
        (acc, entry) => acc + entry.quantity,
        0,
      ),
      totalRevenue: mappedRegistrations.reduce(
        (acc, entry) => acc + entry.finalAmount,
        0,
      ),
    },
  } satisfies EventDetail;
}

export async function createEvent(input: EventWriteInput) {
  const supabase = createSupabaseAdminClient();
  const payload = mapEventWriteInput(input);

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    logger.error("Failed to create event", {
      message: error?.message,
      payload,
    });
    throw new Error("Unable to create event");
  }

  const eventId = data.id;

  // Insert Coupons
  if (input.coupons && input.coupons.length > 0) {
    const couponsPayload = input.coupons.map((c) =>
      mapCouponWriteInput({ ...c, eventId }, true),
    );
    const { error: couponError } = await supabase
      .from("event_coupons")
      .insert(couponsPayload);

    if (couponError) {
      logger.error("Failed to create event coupons via createEvent", {
        eventId,
        message: couponError.message,
      });
      // Not throwing here to avoid partial state if possible, or we could delete event.
      // For now, logging error. User might need to add coupons manually later.
    }
  }

  // Insert Form Fields
  if (input.formFields && input.formFields.length > 0) {
    const fieldsPayload = input.formFields.map((f) =>
      mapFormFieldWriteInput({ ...f, eventId }, true),
    );
    const { error: fieldError } = await supabase
      .from("event_form_fields")
      .insert(fieldsPayload);

    if (fieldError) {
      logger.error("Failed to create event form fields via createEvent", {
        eventId,
        message: fieldError.message,
      });
    }
  }

  // Insert Tickets
  const ticketIdMap = new Map<string, string>();
  if (input.tickets && input.tickets.length > 0) {
    const ticketsPayload = input.tickets.map((t) =>
      mapTicketWriteInput({ ...t, eventId }, true),
    );
    const { data: insertedTickets, error: ticketError } = await supabase
      .from("event_tickets")
      .insert(ticketsPayload)
      .select("id, description");

    if (ticketError) {
      logger.error("Failed to create event tickets via createEvent", {
        eventId,
        message: ticketError.message,
      });
    }

    if (insertedTickets) {
      insertedTickets.forEach((t) => {
        const name = (t.description as any)?.name;
        if (name) ticketIdMap.set(name, t.id);
      });
    }
  }

  // Insert Bundle Offers
  if (input.bundleOffers && input.bundleOffers.length > 0) {
    const bundlesPayload = input.bundleOffers.map((b) => {
      // Map names to IDs if possible (they might be names like "heyy" from the frontend)
      const mappedTicketIds = b.applicableTicketIds
        ?.map((idOrName) => {
          // If it's already a UUID, ticketIdMap.get will return undefined and we keep it
          // If it's a name, it will be replaced by the UUID from the map
          return ticketIdMap.get(idOrName) || idOrName;
        })
        .filter(Boolean) as string[];

      return mapBundleOfferWriteInput(
        {
          ...b,
          eventId,
          applicableTicketIds:
            mappedTicketIds.length > 0 ? mappedTicketIds : null,
        },
        true,
      );
    });

    const { error: bundleError } = await supabase
      .from("event_bundle_offers")
      .insert(bundlesPayload);

    if (bundleError) {
      logger.error("Failed to create event bundle offers via createEvent", {
        eventId,
        message: bundleError.message,
        payload: bundlesPayload,
      });
    }
  }

  return eventId;
}

export async function updateEvent(params: {
  eventId: string;
  input: EventWriteInput;
}) {
  const { eventId, input } = params;
  const supabase = createSupabaseAdminClient();
  const payload = mapEventWriteInput(input);

  const { error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", eventId)
    .is("deleted_at", null);

  if (error) {
    logger.error("Failed to update event", {
      eventId,
      message: error.message,
      payload,
    });
    throw new Error("Unable to update event");
  }

  await syncRegistrationVerificationMode({
    eventId,
    verificationRequired: payload.verification_required,
  });
}

export async function updateEventStatus(params: {
  eventId: string;
  status: string;
}) {
  const { eventId, status } = params;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)
    .is("deleted_at", null);

  if (error) {
    logger.error("Failed to update event status", {
      eventId,
      status,
      message: error.message,
    });
    throw new Error("Unable to update event status");
  }
}

export async function verifyEventRegistration(params: {
  eventId: string;
  registrationId: string;
}) {
  const { eventId, registrationId } = params;
  const supabase = createSupabaseAdminClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,verification_required")
    .eq("id", eventId)
    .is("deleted_at", null)
    .single<{ id: string; verification_required: boolean }>();

  if (eventError || !event) {
    logger.error("Failed to fetch event before registration verification", {
      eventId,
      registrationId,
      message: eventError?.message,
    });
    throw new Error("Unable to verify registration for this event");
  }

  if (!event.verification_required) {
    throw new Error("Verification is not required for this event");
  }

  const { error } = await supabase
    .from("event_registrations")
    .update({ is_verified: true })
    .eq("id", registrationId)
    .eq("event_id", eventId);

  if (error) {
    logger.error("Failed to verify registration", {
      eventId,
      registrationId,
      message: error.message,
    });
    throw new Error("Unable to verify registration");
  }
}

export async function softDeleteEvent(params: { eventId: string }) {
  const { eventId } = params;
  const supabase = createSupabaseAdminClient();
  const deletedAt = new Date().toISOString();

  // NOTE: event_tickets table exists but we removed it from other queries due to schema mismatch in registrations.
  // However, for soft delete, we should still try to delete associated tickets if they exist.
  // Assuming the table event_tickets exists (validated earlier).

  const [eventDeleteResult, ticketDeleteResult, couponDeleteResult] =
    await Promise.all([
      supabase
        .from("events")
        .update({ deleted_at: deletedAt })
        .eq("id", eventId)
        .is("deleted_at", null),
      supabase
        .from("event_tickets")
        .update({ deleted_at: deletedAt })
        .eq("event_id", eventId)
        .is("deleted_at", null),
      supabase
        .from("event_coupons")
        .update({ deleted_at: deletedAt, is_active: false })
        .eq("event_id", eventId)
        .is("deleted_at", null),
    ]);

  if (
    eventDeleteResult.error ||
    ticketDeleteResult.error ||
    couponDeleteResult.error
  ) {
    logger.error("Failed to soft delete event graph", {
      eventId,
      eventError: eventDeleteResult.error?.message,
      ticketError: ticketDeleteResult.error?.message,
      couponError: couponDeleteResult.error?.message,
    });
    throw new Error("Unable to archive event");
  }
}

export async function restoreEvent(params: { eventId: string }) {
  const { eventId } = params;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("events")
    .update({ deleted_at: null })
    .eq("id", eventId)
    .not("deleted_at", "is", null);

  if (error) {
    logger.error("Failed to restore event", {
      eventId,
      message: error.message,
    });
    throw new Error("Unable to restore event");
  }
}

export async function createEventTicket(input: TicketWriteInput) {
  const supabase = createSupabaseAdminClient();
  const payload = mapTicketWriteInput(input, true);

  const { error } = await supabase.from("event_tickets").insert(payload);
  if (error) {
    logger.error("Failed to create event ticket", {
      message: error.message,
      payload,
    });
    throw new Error("Unable to create ticket");
  }
}

export async function updateEventTicket(params: {
  ticketId: string;
  input: TicketWriteInput;
}) {
  const { ticketId, input } = params;
  const supabase = createSupabaseAdminClient();
  const payload = mapTicketWriteInput(input, false);

  const { error } = await supabase
    .from("event_tickets")
    .update(payload)
    .eq("id", ticketId)
    .is("deleted_at", null);

  if (error) {
    logger.error("Failed to update event ticket", {
      ticketId,
      message: error.message,
      payload,
    });
    throw new Error("Unable to update ticket");
  }
}

export async function softDeleteEventTicket(params: { ticketId: string }) {
  const { ticketId } = params;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("event_tickets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", ticketId)
    .is("deleted_at", null);

  if (error) {
    logger.error("Failed to soft delete event ticket", {
      ticketId,
      message: error.message,
    });
    throw new Error("Unable to archive ticket");
  }
}

export async function createEventCoupon(input: CouponWriteInput) {
  const supabase = createSupabaseAdminClient();
  const payload = mapCouponWriteInput(input, true);

  const { error } = await supabase.from("event_coupons").insert(payload);
  if (error) {
    logger.error("Failed to create event coupon", {
      message: error.message,
      payload,
    });
    throw new Error("Unable to create coupon");
  }
}

export async function updateEventCoupon(params: {
  couponId: string;
  input: CouponWriteInput;
}) {
  const { couponId, input } = params;
  const supabase = createSupabaseAdminClient();
  const payload = mapCouponWriteInput(input, false);

  const { error } = await supabase
    .from("event_coupons")
    .update(payload)
    .eq("id", couponId)
    .is("deleted_at", null);

  if (error) {
    logger.error("Failed to update event coupon", {
      couponId,
      message: error.message,
      payload,
    });
    throw new Error("Unable to update coupon");
  }
}

export async function softDeleteEventCoupon(params: { couponId: string }) {
  const { couponId } = params;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("event_coupons")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", couponId)
    .is("deleted_at", null);

  if (error) {
    logger.error("Failed to soft delete event coupon", {
      couponId,
      message: error.message,
    });
    throw new Error("Unable to archive coupon");
  }
}

export async function createEventFormField(input: FormFieldWriteInput) {
  const supabase = createSupabaseAdminClient();
  const payload = mapFormFieldWriteInput(input, true);

  const { error } = await supabase.from("event_form_fields").insert(payload);
  if (error) {
    logger.error("Failed to create event form field", {
      message: error.message,
      payload,
    });
    throw new Error("Unable to create form field");
  }
}

export async function updateEventFormField(params: {
  formFieldId: string;
  input: FormFieldWriteInput;
}) {
  const { formFieldId, input } = params;
  const supabase = createSupabaseAdminClient();
  const payload = mapFormFieldWriteInput(input, false);

  const { error } = await supabase
    .from("event_form_fields")
    .update(payload)
    .eq("id", formFieldId);

  if (error) {
    logger.error("Failed to update event form field", {
      formFieldId,
      message: error.message,
      payload,
    });
    throw new Error("Unable to update form field");
  }
}

export async function deleteEventFormField(params: { formFieldId: string }) {
  const { formFieldId } = params;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("event_form_fields")
    .delete()
    .eq("id", formFieldId);

  if (error) {
    logger.error("Failed to delete event form field", {
      formFieldId,
      message: error.message,
    });
    throw new Error("Unable to delete form field");
  }
}
export async function listAllRegistrations(): Promise<BookingDetail[]> {
  const supabase = createSupabaseAdminClient();

  // We'll fetch registrations and join with related tables
  // Note: Using select with joins in Supabase/PostgREST
  const { data, error } = await supabase
    .from("event_registrations")
    .select(
      `
      id,
      event_id,
      user_id,
      coupon_id,
      tickets_bought,
      total_amount,
      discount_amount,
      final_amount,
      payment_status,
      form_response,
      created_at,
      is_verified,
      events (
        name
      ),
      users (
        email,
        full_name,
        phone
      ),
      event_coupons (
        code
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to list all registrations", { error: error.message });
    throw new Error("Unable to load bookings");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((reg: any) => ({
    id: reg.id,
    eventId: reg.event_id,
    eventName: reg.events?.name || "Unknown Event",
    ticketId: "unknown",
    ticketName: "Unknown Ticket",
    userId: reg.user_id,
    userEmail: reg.users?.email || null,
    userName: reg.users?.full_name || null,
    userPhone: reg.users?.phone || null,
    couponId: reg.coupon_id,
    couponCode: reg.event_coupons?.code || null,
    quantity: reg.tickets_bought,
    totalAmount: parseFloat(reg.total_amount),
    finalAmount: parseFloat(reg.final_amount),
    paymentStatus: reg.payment_status,
    formResponse: reg.form_response,
    createdAt: reg.created_at,
    isVerified: reg.is_verified,
  }));
}
export async function listPublicEvents() {
  const supabase = createSupabaseAdminClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(EVENT_SELECT_FIELDS)
    .in("status", ["published", "completed", "cancelled"])
    .is("deleted_at", null)
    .order("event_date", { ascending: true })
    .returns<EventRow[]>();

  if (error) {
    logger.error("Failed to list public events", { error: error.message });
    throw new Error("Unable to load events");
  }

  return (events ?? [])
    .sort((a, b) => {
      const statusOrder: Record<string, number> = {
        published: 0,
        completed: 1,
        cancelled: 2,
      };

      const orderA = statusOrder[a.status] ?? 3;
      const orderB = statusOrder[b.status] ?? 3;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Secondary sort by date
      const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
      const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
      return dateA - dateB;
    })
    .map((event) => ({
      id: event.id,
      name: event.name,
      bannerUrl: event.base_event_banner,
      status: event.status,
      eventDate: event.event_date,
      city: event.city,
      state: event.state,
      country: event.country,
      about: event.about,
      registrationStart: event.registration_start,
      registrationEnd: event.registration_end,
    }));
}
export async function getPublicEventDetail(eventId: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error: eventError } = await supabase
    .from("events")
    .select(EVENT_SELECT_FIELDS)
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();

  const event = data as EventRow | null;

  if (eventError || !event) {
    logger.error("Failed to get public event detail", {
      eventId,
      error: eventError?.message,
    });
    throw new Error("Unable to load event details");
  }

  const [
    { data: tickets, error: ticketError },
    { data: formFields, error: fieldError },
    { data: bundleOffers, error: bundleOfferError },
  ] = await Promise.all([
    supabase
      .from("event_tickets")
      .select(TICKET_SELECT_FIELDS)
      .eq("event_id", eventId)
      .is("deleted_at", null)
      .returns<TicketRow[]>(),
    supabase
      .from("event_form_fields")
      .select(FORM_FIELD_SELECT_FIELDS)
      .eq("event_id", eventId)
      .order("display_order", { ascending: true })
      .returns<FormFieldRow[]>(),
    supabase
      .from("event_bundle_offers")
      .select(BUNDLE_OFFER_SELECT_FIELDS)
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .returns<BundleOfferRow[]>(),
  ]);

  if (ticketError || fieldError || bundleOfferError) {
    logger.error("Failed to get public event components", {
      eventId,
      ticketError: ticketError?.message,
      fieldError: fieldError?.message,
      bundleOfferError: bundleOfferError?.message,
    });
    throw new Error("Unable to load event details");
  }

  return {
    event: {
      id: event.id,
      name: event.name,
      bannerUrl: event.base_event_banner,
      eventDate: event.event_date,
      address1: event.address_line_1,
      address2: event.address_line_2,
      city: event.city,
      state: event.state,
      country: event.country,
      about: event.about,
      termsAndConditions: event.terms_and_conditions,
      status: event.status,
    },
    tickets: (tickets ?? []).map(mapTicket),
    formFields: (formFields ?? []).map(mapFormField),
    bundleOffers: (bundleOffers ?? []).map(mapBundleOffer),
  };
}
export async function createRegistration(input: {
  eventId: string;
  userId?: string | null;
  quantity: number;
  totalAmount: number;
  finalAmount: number;
  formResponse: JsonValue;
}) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("event_registrations")
    .insert({
      event_id: input.eventId,
      user_id: input.userId ?? null,
      tickets_bought: input.quantity,
      total_amount: input.totalAmount,
      final_amount: input.finalAmount,
      payment_status: "pending",
      form_response: input.formResponse,
      is_verified: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    logger.error("Failed to create registration", {
      message: error?.message,
      input,
    });
    throw new Error("Unable to create registration");
  }

  return data.id;
}

export async function validateCoupon(params: {
  eventId: string;
  code: string;
}) {
  const { eventId, code } = params;
  const supabase = createSupabaseAdminClient();

  const { data: coupon, error } = await supabase
    .from("event_coupons")
    .select("*")
    .eq("event_id", eventId)
    .eq("code", code)
    .is("deleted_at", null)
    .maybeSingle<CouponRow>();

  if (error) {
    logger.error("Error validating coupon", {
      eventId,
      code,
      error: error.message,
    });
    throw new Error("Unable to validate coupon");
  }

  if (!coupon) {
    throw new Error("Invalid coupon code");
  }

  if (!coupon.is_active) {
    throw new Error("This coupon is no longer active");
  }

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    throw new Error("This coupon is not yet valid");
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    throw new Error("This coupon has expired");
  }

  return mapCoupon(coupon);
}
