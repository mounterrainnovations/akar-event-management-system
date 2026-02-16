import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const EVENT_REGISTRATIONS_TABLE =
  process.env.EVENT_REGISTRATIONS_TABLE || "event_registrations";

export type EventRegistrationRow = {
  id: string;
  transaction_id: string | null;
  payment_status: string;
};

export type EventRegistrationReuseRow = {
  id: string;
  event_id: string;
  user_id: string;
  deleted_at: string | null;
  is_waitlisted: boolean | null;
  payment_status: string;
};

export async function insertEventRegistration<T extends Record<string, unknown>>(
  payload: Record<string, unknown>,
  selectFields: string,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(EVENT_REGISTRATIONS_TABLE)
    .insert(payload)
    .select(selectFields)
    .single<T>();

  if (error || !data) {
    throw new Error(
      `Unable to create event registration: ${error?.message || "No row returned"}`,
    );
  }

  return data;
}

export async function listEventRegistrationIdsByEventId(input: {
  eventId: string;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
}) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from(EVENT_REGISTRATIONS_TABLE)
    .select("id")
    .eq("event_id", input.eventId)
    .is("deleted_at", null);

  if (input.paymentStatus) {
    query = query.eq("payment_status", input.paymentStatus);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(
      `Unable to list event registrations by eventId: ${error.message}`,
    );
  }

  return (data || []).map((row) => row.id as string);
}

export async function getEventRegistrationTransactionLookup(registrationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(EVENT_REGISTRATIONS_TABLE)
    .select("id,transaction_id,payment_status")
    .eq("id", registrationId)
    .maybeSingle<EventRegistrationRow>();

  if (error || !data?.id) {
    throw new Error(
      `Unable to find registration for transaction lookup: ${error?.message || "Registration not found"}`,
    );
  }

  return {
    registrationId: data.id,
    transactionId: data.transaction_id?.trim() || "",
    paymentStatus: data.payment_status,
  };
}

export async function getEventRegistrationForUserEvent(input: {
  registrationId: string;
  userId: string;
  eventId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(EVENT_REGISTRATIONS_TABLE)
    .select("id,event_id,user_id,deleted_at,is_waitlisted,payment_status")
    .eq("id", input.registrationId)
    .eq("user_id", input.userId)
    .eq("event_id", input.eventId)
    .maybeSingle<EventRegistrationReuseRow>();

  if (error) {
    throw new Error(
      `Unable to fetch event registration by id for user and event: ${error.message}`,
    );
  }

  return data;
}

export async function updateEventRegistrationById<T extends Record<string, unknown>>(input: {
  registrationId: string;
  payload: Record<string, unknown>;
  selectFields: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(EVENT_REGISTRATIONS_TABLE)
    .update(input.payload)
    .eq("id", input.registrationId)
    .select(input.selectFields)
    .maybeSingle<T>();

  if (error || !data) {
    throw new Error(
      `Unable to update event registration: ${error?.message || "No row returned"}`,
    );
  }

  return data;
}
