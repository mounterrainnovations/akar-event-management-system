import { createHash, randomUUID } from "node:crypto";
import {
  getEasebuzzBaseUrl,
  getEasebuzzInitiatePath,
  getEasebuzzKey,
  getEasebuzzSalt,
  getPaymentCallbackBaseUrl,
} from "@/lib/payments/easebuzz/config";
import { getLogger } from "@/lib/logger";

const logger = getLogger("easebuzz-service");

export type InitiateEasebuzzPaymentInput = {
  amount: number;
  productInfo: string;
  firstName: string;
  email: string;
  phone: string;
  eventId?: string;
  registrationId?: string;
  userId?: string;
  transactionId?: string;
  udf5?: string;
  udf6?: string;
  udf7?: string;
  udf8?: string;
  udf9?: string;
  udf10?: string;
};

export type EasebuzzInitiateResult = {
  ok: boolean;
  status: number;
  endpoint: string;
  data: {
    status: number;
    data: string;
  };
};

function sha512(value: string) {
  return createHash("sha512").update(value, "utf8").digest("hex");
}

function normalizeAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  return amount.toFixed(2);
}

function resolveCallbackBaseUrl(requestOrigin: string) {
  return getPaymentCallbackBaseUrl() || requestOrigin;
}

export function buildEasebuzzCallbackUrls(args: { requestOrigin: string }) {
  const baseUrl = resolveCallbackBaseUrl(args.requestOrigin);
  const callbackUrl = new URL("/api/payments/easebuzz/callback", baseUrl);
  return {
    callback: callbackUrl.toString(),
  };
}

export function buildEasebuzzInitiatePayload(args: {
  input: InitiateEasebuzzPaymentInput;
  requestOrigin: string;
}) {
  const key = getEasebuzzKey();
  const salt = getEasebuzzSalt();

  const transactionId = randomUUID();
  const callbackUrls = buildEasebuzzCallbackUrls({
    requestOrigin: args.requestOrigin,
  });

  const payload: Record<string, string> = {
    key,
    txnid: transactionId,
    amount: normalizeAmount(args.input.amount),
    productinfo: args.input.productInfo,
    firstname: args.input.firstName,
    email: args.input.email,
    phone: args.input.phone,
    surl: callbackUrls.callback,
    furl: callbackUrls.callback,
    udf1: args.input.registrationId || "registrationId",
    udf2: args.input.eventId || "eventId",
    udf3: args.input.userId || "userId",
    udf4: transactionId || "transactionId",
    udf5: args.input.udf5 || "",
    udf6: args.input.udf6 || "",
    udf7: args.input.udf7 || "",
    udf8: args.input.udf8 || "",
    udf9: args.input.udf9 || "",
    udf10: args.input.udf10 || "",
    show_payment_mode: "NB,CC,DC,UPI",
  };

  const hashString =
    `${key}|${payload.txnid}|${payload.amount}|${payload.productinfo}|${payload.firstname}|${payload.email}|` +
    `${payload.udf1}|${payload.udf2}|${payload.udf3}|${payload.udf4}|${payload.udf5}|${payload.udf6}|` +
    `${payload.udf7}|${payload.udf8}|${payload.udf9}|${payload.udf10}|${salt}`;
  payload.hash = sha512(hashString).toString();

  return {
    payload,
    transactionId,
  };
}

export async function initiateEasebuzzTransaction(
  payload: Record<string, string>,
): Promise<EasebuzzInitiateResult> {
  const endpoint = `${getEasebuzzBaseUrl()}${getEasebuzzInitiatePath()}`;
  const formPayload = new URLSearchParams(payload);

  logger.info("Initiating Easebuzz payment", {
    endpoint,
    txnid: payload.txnid,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formPayload,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return {
    ok: response.ok,
    status: response.status,
    endpoint,
    data,
  };
}
