import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE || "payments";

export const PAYMENT_SELECT_FIELDS =
  "id,registration_id,user_id,easebuzz_txnid,amount,refund_amount,status,mode,gateway_response_message,initiated_at,completed_at,refunded_at,created_at,updated_at";

export type PaymentRow = {
  id: string;
  registration_id: string;
  user_id: string;
  easebuzz_txnid: string | null;
  amount: string;
  refund_amount: string | null;
  status: string;
  mode: string | null;
  gateway_response_message: string | null;
  initiated_at: string | null;
  completed_at: string | null;
  refunded_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ListPaymentsInput = {
  page: number;
  limit: number;
  userId?: string;
  registrationIds?: string[];
};

type PendingPaymentRegistrationRow = {
  registration_id: string;
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

export function mapPaymentRow(row: PaymentRow) {
  return {
    id: row.id,
    registrationId: row.registration_id,
    userId: row.user_id,
    transactionId: row.easebuzz_txnid,
    amount: toNumber(row.amount),
    refundAmount: toNumber(row.refund_amount),
    status: row.status,
    mode: row.mode,
    gatewayResponseMessage: row.gateway_response_message,
    initiatedAt: row.initiated_at,
    completedAt: row.completed_at,
    refundedAt: row.refunded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPayments(input: ListPaymentsInput) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from(PAYMENTS_TABLE)
    .select(PAYMENT_SELECT_FIELDS, { count: "exact" })
    .order("created_at", { ascending: false });

  if (input.userId) {
    query = query.eq("user_id", input.userId);
  }

  if (input.registrationIds) {
    if (input.registrationIds.length === 0) {
      return {
        items: [] as PaymentRow[],
        total: 0,
      };
    }

    query = query.in("registration_id", input.registrationIds);
  }

  const from = (input.page - 1) * input.limit;
  const to = from + input.limit - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Unable to list payments: ${error.message}`);
  }

  return {
    items: (data || []) as PaymentRow[],
    total: count || 0,
  };
}

export async function getPaymentByRegistrationId(registrationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select(PAYMENT_SELECT_FIELDS)
    .eq("registration_id", registrationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<PaymentRow>();

  if (error) {
    throw new Error(`Unable to fetch payment by registrationId: ${error.message}`);
  }

  return data;
}

export async function getPaymentByTransactionId(transactionId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select(PAYMENT_SELECT_FIELDS)
    .eq("easebuzz_txnid", transactionId)
    .maybeSingle<PaymentRow>();

  if (error) {
    throw new Error(`Unable to fetch payment by transactionId: ${error.message}`);
  }

  return data;
}

export async function listPendingPaymentRegistrationIdsPage(input: {
  page: number;
  limit: number;
}) {
  const supabase = createSupabaseAdminClient();
  const from = (input.page - 1) * input.limit;
  const to = from + input.limit - 1;

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select("registration_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(
      `Unable to list pending payment registration ids: ${error.message}`,
    );
  }

  return (data || [])
    .map((row) => (row as PendingPaymentRegistrationRow).registration_id)
    .filter(Boolean);
}
