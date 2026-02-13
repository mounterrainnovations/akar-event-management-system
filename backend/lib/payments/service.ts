import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";
import {
  getPaymentReferenceFromCallback,
  getRegistrationIdFromCallback,
  mapCallbackOutcomeToPaymentStatus,
  type EasebuzzCallbackPayload,
} from "@/lib/payments/easebuzz/service";

const logger = getLogger("payments-service");

const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE || "payments";
const PAYMENT_LOGS_TABLE = process.env.PAYMENT_LOGS_TABLE || "payment_logs";

type CallbackProcessingInput = {
  outcome: "success" | "failure";
  payload: EasebuzzCallbackPayload;
  queryPaymentRef: string | null;
  queryRegistrationId: string | null;
};

export type CallbackProcessingResult = {
  paymentReference: string;
  registrationId: string;
  status: "paid" | "failed";
};

function normalizeGatewayStatus(rawStatus: string | undefined, fallback: "success" | "failure") {
  const normalized = (rawStatus || "").trim().toLowerCase();
  if (normalized === "success") {
    return "success" as const;
  }
  if (normalized === "failure") {
    return "failure" as const;
  }
  return fallback;
}

function requireValue(value: string, field: string) {
  if (!value) {
    throw new Error(`${field} not found in callback payload`);
  }

  return value;
}

async function upsertPaymentRow(args: {
  paymentReference: string;
  registrationId: string;
  status: "paid" | "failed";
  amount: string;
  gatewayStatus: string;
  payload: EasebuzzCallbackPayload;
}) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from(PAYMENTS_TABLE).upsert(
    {
      payment_reference: args.paymentReference,
      registration_id: args.registrationId,
      gateway: "easebuzz",
      gateway_transaction_id: args.payload.easepayid || null,
      amount: args.amount,
      status: args.status,
      gateway_status: args.gatewayStatus,
      metadata: args.payload,
    },
    {
      onConflict: "payment_reference",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    throw new Error(`Unable to upsert payment row: ${error.message}`);
  }
}

async function insertPaymentLog(args: {
  paymentReference: string;
  status: "paid" | "failed";
  payload: EasebuzzCallbackPayload;
}) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from(PAYMENT_LOGS_TABLE).insert({
    payment_reference: args.paymentReference,
    provider: "easebuzz",
    status: args.status,
    payload: args.payload,
  });

  if (error) {
    throw new Error(`Unable to insert payment log row: ${error.message}`);
  }
}

async function updateRegistrationStatus(args: { registrationId: string; status: "paid" | "failed" }) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("event_registrations")
    .update({ payment_status: args.status })
    .eq("id", args.registrationId);

  if (error) {
    throw new Error(`Unable to update event registration payment status: ${error.message}`);
  }
}

export async function processEasebuzzCallback(input: CallbackProcessingInput): Promise<CallbackProcessingResult> {
  const callbackOutcome = normalizeGatewayStatus(input.payload.status, input.outcome);
  const status = mapCallbackOutcomeToPaymentStatus(callbackOutcome);

  const paymentReference = requireValue(
    getPaymentReferenceFromCallback(input.payload, input.queryPaymentRef),
    "payment reference",
  );

  const registrationId = requireValue(
    getRegistrationIdFromCallback(input.payload, input.queryRegistrationId),
    "registration id",
  );

  const amount = input.payload.amount || "0.00";

  await upsertPaymentRow({
    paymentReference,
    registrationId,
    status,
    amount,
    gatewayStatus: callbackOutcome,
    payload: input.payload,
  });

  await insertPaymentLog({
    paymentReference,
    status,
    payload: input.payload,
  });

  await updateRegistrationStatus({
    registrationId,
    status,
  });

  logger.info("Processed Easebuzz callback", {
    paymentReference,
    registrationId,
    status,
    gatewayStatus: callbackOutcome,
  });

  return {
    paymentReference,
    registrationId,
    status,
  };
}
