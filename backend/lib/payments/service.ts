import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";

const logger = getLogger("payments-service");

const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE || "payments";
const PAYMENT_LOGS_TABLE = process.env.PAYMENT_LOGS_TABLE || "payment_logs";
const EVENT_REGISTRATIONS_TABLE =
  process.env.EVENT_REGISTRATIONS_TABLE || "event_registrations";

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
  easebuzzStatus?: string | number | null;
  errorMessage?: string | null;
};

type LogCallbackPaymentInput = {
  action?: "callback" | "transaction";
  transactionId?: string | null;
  easebuzzTxnId?: string | null;
  easebuzzUrl: string;
  requestPayload: Record<string, string> | null;
  responsePayload: unknown;
  httpStatus: number;
  easebuzzStatus?: string | number | null;
  errorMessage?: string | null;
};

type CallbackBusinessUpdateInput = {
  transactionId?: string | null;
  easebuzzTxnId?: string | null;
  registrationId?: string | null;
  flow: "success" | "failure" | "pending";
  callbackStatus: string;
  gatewayMessage?: string | null;
  paymentMode?: string | null;
};

type RegistrationTransactionLookup = {
  registrationId: string;
  transactionId: string;
};

function normalizeAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  return amount.toFixed(2);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function getRegistrationTransactionLookup(
  registrationId: string,
): Promise<RegistrationTransactionLookup> {
  if (!isUuid(registrationId)) {
    throw new Error("registrationId must be a valid UUID");
  }

  const supabase = createSupabaseAdminClient();
  const { data: registrationData, error: registrationError } = await supabase
    .from(EVENT_REGISTRATIONS_TABLE)
    .select("id,transaction_id")
    .eq("id", registrationId)
    .maybeSingle<{ id: string; transaction_id: string | null }>();

  if (registrationError || !registrationData?.id) {
    throw new Error(
      `Unable to find registration for transaction lookup: ${registrationError?.message || "Registration not found"}`,
    );
  }

  const transactionId = registrationData.transaction_id?.trim() || "";
  if (!transactionId) {
    throw new Error("No transaction_id mapped for this registration");
  }

  return {
    registrationId: registrationData.id,
    transactionId,
  };
}

async function fetchPaymentIdByColumn(
  column: "id" | "easebuzz_txnid",
  value: string,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select("id")
    .eq(column, value)
    .maybeSingle<{ id: string }>();

  if (error || !data?.id) {
    return null;
  }

  return data.id;
}

async function fetchPaymentId(input: {
  transactionId?: string | null;
  easebuzzTxnId?: string | null;
}) {
  const transactionId = input.transactionId?.trim();
  if (transactionId) {
    const byId = await fetchPaymentIdByColumn("id", transactionId);
    if (byId) {
      return byId;
    }
  }

  const easebuzzTxnId = input.easebuzzTxnId?.trim() || transactionId;
  if (!easebuzzTxnId) {
    return null;
  }

  const byEasebuzzTxnId = await fetchPaymentIdByColumn(
    "easebuzz_txnid",
    easebuzzTxnId,
  );
  if (byEasebuzzTxnId) {
    return byEasebuzzTxnId;
  }

  return null;
}

function mapFlowToPaymentStatus(flow: "success" | "failure" | "pending") {
  if (flow === "success") {
    return "paid";
  }
  if (flow === "failure") {
    return "failed";
  }
  return "pending";
}

function mapCallbackModeToPaymentMode(mode?: string | null) {
  const normalized = (mode || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized === "upi") {
    return "upi";
  }
  if (
    normalized === "nb" ||
    normalized === "netbanking" ||
    normalized === "net_banking" ||
    normalized === "net banking"
  ) {
    return "net_banking";
  }
  if (
    normalized === "dc" ||
    normalized === "debitcard" ||
    normalized === "debit_card" ||
    normalized === "debit card"
  ) {
    return "debit_card";
  }
  if (
    normalized === "cc" ||
    normalized === "creditcard" ||
    normalized === "credit_card" ||
    normalized === "credit card"
  ) {
    return "credit_card";
  }
  return null;
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

  const { error: registrationLinkError } = await supabase
    .from(EVENT_REGISTRATIONS_TABLE)
    .update({
      transaction_id: input.easebuzzTxnId,
    })
    .eq("id", input.registrationId);

  if (registrationLinkError) {
    throw new Error(
      `Unable to link registration with transaction id during initiate: ${registrationLinkError.message}`,
    );
  }

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

export async function logCallbackPaymentRequest(
  input: LogCallbackPaymentInput,
) {
  const supabase = createSupabaseAdminClient();
  const paymentId = await fetchPaymentId({
    transactionId: input.transactionId,
    easebuzzTxnId: input.easebuzzTxnId,
  });

  const { error } = await supabase.from(PAYMENT_LOGS_TABLE).insert({
    payment_id: paymentId,
    action: input.action || "callback",
    easebuzz_url: input.easebuzzUrl,
    request_payload: input.requestPayload,
    response_payload: input.responsePayload || null,
    http_status: input.httpStatus,
    easebuzz_status: input.easebuzzStatus || null,
    error_message: input.errorMessage || null,
  });

  if (error) {
    throw new Error(
      `Unable to create callback payment log row: ${error.message}`,
    );
  }
}

export async function applyCallbackBusinessStatus(
  input: CallbackBusinessUpdateInput,
) {
  const supabase = createSupabaseAdminClient();
  const paymentStatus = mapFlowToPaymentStatus(input.flow);
  const paymentId = await fetchPaymentId({
    transactionId: input.transactionId,
    easebuzzTxnId: input.easebuzzTxnId,
  });

  const paymentUpdatePayload: {
    status: "paid" | "failed" | "pending";
    gateway_response_message: string | null;
    mode?: "upi" | "net_banking" | "debit_card" | "credit_card";
    completed_at: string | null;
    updated_at: string;
  } = {
    status: paymentStatus,
    gateway_response_message:
      input.gatewayMessage ||
      `Easebuzz callback status: ${input.callbackStatus}`,
    completed_at: paymentStatus === "paid" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const normalizedMode = mapCallbackModeToPaymentMode(input.paymentMode);
  if (normalizedMode) {
    paymentUpdatePayload.mode = normalizedMode;
  }

  if (paymentId) {
    const { error } = await supabase
      .from(PAYMENTS_TABLE)
      .update(paymentUpdatePayload)
      .eq("id", paymentId);

    if (error) {
      throw new Error(
        `Unable to update payment status from callback: ${error.message}`,
      );
    }
  } else {
    logger.warn("Callback payment row not found for status update", {
      transactionId: input.transactionId || null,
      easebuzzTxnId: input.easebuzzTxnId || null,
      flow: input.flow,
    });
  }

  const registrationId = input.registrationId?.trim();
  if (!registrationId) {
    logger.warn(
      "Callback registrationId missing; skipped registration update",
      {
        transactionId: input.transactionId || null,
        flow: input.flow,
      },
    );
    return;
  }
  if (!isUuid(registrationId)) {
    logger.warn(
      "Callback registrationId is not a valid UUID; skipped registration update",
      {
        registrationId,
        transactionId: input.transactionId || null,
        flow: input.flow,
      },
    );
    return;
  }

  const registrationUpdatePayload: {
    payment_status: "paid" | "failed" | "pending";
    transaction_id?: string;
  } = {
    payment_status: paymentStatus,
  };
  const transactionIdForRegistration =
    input.easebuzzTxnId?.trim() || input.transactionId?.trim();
  if (transactionIdForRegistration) {
    registrationUpdatePayload.transaction_id = transactionIdForRegistration;
  }

  const registrationUpdateQuery = supabase
    .from(EVENT_REGISTRATIONS_TABLE)
    .update(registrationUpdatePayload)
    .eq("id", registrationId);

  const { error } = await registrationUpdateQuery;
  if (error) {
    throw new Error(
      `Unable to update event registration payment status from callback: ${error.message}`,
    );
  }
}
