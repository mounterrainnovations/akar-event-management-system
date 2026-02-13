import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";

const logger = getLogger("payments-service");

const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE || "payments";
const PAYMENT_LOGS_TABLE = process.env.PAYMENT_LOGS_TABLE || "payment_logs";

type CreatePendingPaymentInput = {
  transactionId: string;
  registrationId: string;
  userId: string;
  amount: number;
  easebuzzTxnId: string;
};

type LogInitiatePaymentInput = {
  transactionId: string;
  easebuzzUrl: string;
  requestPayload: Record<string, string>;
  responsePayload: unknown;
  httpStatus: number;
  easebuzzStatus?: string | null;
  errorMessage?: string | null;
};

function normalizeAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  return amount.toFixed(2);
}

export async function createPendingPayment(input: CreatePendingPaymentInput) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .insert({
      id: input.transactionId,
      registration_id: input.registrationId,
      user_id: input.userId,
      easebuzz_txnid: input.easebuzzTxnId,
      amount: normalizeAmount(input.amount),
      status: "pending",
      initiated_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data?.id) {
    throw new Error(
      `Unable to create pending payment row: ${error?.message || "Unknown error"}`,
    );
  }

  logger.info("Created pending payment row", {
    paymentId: data.id,
    registrationId: input.registrationId,
    userId: input.userId,
    easebuzzTxnId: input.easebuzzTxnId,
  });

  return data.id;
}

export async function logInitiatePaymentRequest(
  input: LogInitiatePaymentInput,
) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from(PAYMENT_LOGS_TABLE).insert({
    payment_id: input.transactionId,
    action: "initiate",
    easebuzz_url: input.easebuzzUrl,
    request_payload: input.requestPayload,
    response_payload: input.responsePayload,
    http_status: input.httpStatus,
    easebuzz_status: input.easebuzzStatus || null,
    error_message: input.errorMessage || null,
  });

  if (error) {
    throw new Error(`Unable to create payment log row: ${error.message}`);
  }
}

export async function markPaymentInitiateFailed(input: {
  transactionId: string;
  message: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from(PAYMENTS_TABLE)
    .update({
      status: "failed",
      gateway_response_message: input.message,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.transactionId);

  if (error) {
    throw new Error(
      `Unable to mark payment initiate as failed: ${error.message}`,
    );
  }
}
