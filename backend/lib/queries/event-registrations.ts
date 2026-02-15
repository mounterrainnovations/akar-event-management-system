import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const EVENT_REGISTRATIONS_TABLE =
  process.env.EVENT_REGISTRATIONS_TABLE || "event_registrations";

export type EventRegistrationRow = {
  id: string;
  transaction_id: string | null;
  payment_status: string;
};

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
