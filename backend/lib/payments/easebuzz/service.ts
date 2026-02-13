import { createHash, randomUUID } from "node:crypto";
import {
  getEasebuzzBaseUrl,
  getEasebuzzInitiatePath,
  getEasebuzzKey,
  getEasebuzzRequestHashSequence,
  getEasebuzzResponseHashSequence,
  getEasebuzzSalt,
  getPaymentCallbackBaseUrl,
  shouldVerifyEasebuzzCallbackHash,
} from "@/lib/payments/easebuzz/config";
import { getLogger } from "@/lib/logger";

const logger = getLogger("easebuzz-service");

type EasebuzzPrimitive = string | number | boolean | null | undefined;

export type InitiateEasebuzzPaymentInput = {
  amount: number;
  productInfo: string;
  firstName: string;
  email: string;
  phone?: string;
  eventId?: string;
  registrationId?: string;
  userId?: string;
  paymentReference?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
};

export type EasebuzzCallbackPayload = Record<string, string>;

export type EasebuzzInitiateResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

function normalizeString(value: EasebuzzPrimitive) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function splitHashSequence(sequence: string) {
  return sequence.split("|");
}

function buildHashString(params: Record<string, EasebuzzPrimitive>, sequence: string, prefix?: string) {
  const values = splitHashSequence(sequence).map((key) => normalizeString(params[key]));
  const base = values.join("|");

  if (!prefix) {
    return base;
  }

  return `${prefix}|${base}`;
}

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

export function buildEasebuzzCallbackUrls(args: {
  requestOrigin: string;
  paymentReference: string;
  registrationId?: string;
  eventId?: string;
}) {
  const baseUrl = resolveCallbackBaseUrl(args.requestOrigin);
  const successUrl = new URL("/api/payments/easebuzz/callback/success", baseUrl);
  const failureUrl = new URL("/api/payments/easebuzz/callback/failure", baseUrl);

  successUrl.searchParams.set("paymentRef", args.paymentReference);
  failureUrl.searchParams.set("paymentRef", args.paymentReference);

  if (args.registrationId) {
    successUrl.searchParams.set("registrationId", args.registrationId);
    failureUrl.searchParams.set("registrationId", args.registrationId);
  }

  if (args.eventId) {
    successUrl.searchParams.set("eventId", args.eventId);
    failureUrl.searchParams.set("eventId", args.eventId);
  }

  return {
    surl: successUrl.toString(),
    furl: failureUrl.toString(),
  };
}

export function buildEasebuzzInitiatePayload(args: {
  input: InitiateEasebuzzPaymentInput;
  requestOrigin: string;
}) {
  const key = getEasebuzzKey();
  const salt = getEasebuzzSalt();

  const paymentReference = args.input.paymentReference || randomUUID();
  const callbackUrls = buildEasebuzzCallbackUrls({
    requestOrigin: args.requestOrigin,
    paymentReference,
    registrationId: args.input.registrationId,
    eventId: args.input.eventId,
  });

  const payload: Record<string, string> = {
    key,
    txnid: paymentReference,
    amount: normalizeAmount(args.input.amount),
    productinfo: args.input.productInfo,
    firstname: args.input.firstName,
    email: args.input.email,
    phone: args.input.phone || "",
    surl: args.input.successRedirectUrl || callbackUrls.surl,
    furl: args.input.failureRedirectUrl || callbackUrls.furl,
    udf1: args.input.registrationId || "",
    udf2: args.input.eventId || "",
    udf3: args.input.userId || "",
    udf4: paymentReference,
    udf5: "",
  };

  const hashBody = buildHashString(payload, getEasebuzzRequestHashSequence());
  payload.hash = sha512(`${hashBody}|${salt}`);

  return {
    payload,
    paymentReference,
    callbackUrls,
  };
}

export async function initiateEasebuzzTransaction(payload: Record<string, string>): Promise<EasebuzzInitiateResult> {
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
    data,
  };
}

export function verifyEasebuzzCallbackHash(payload: EasebuzzCallbackPayload) {
  if (!shouldVerifyEasebuzzCallbackHash()) {
    return true;
  }

  const providedHash = normalizeString(payload.hash).toLowerCase();
  if (!providedHash) {
    return false;
  }

  const key = getEasebuzzKey();
  const salt = getEasebuzzSalt();
  const verificationPayload = {
    ...payload,
    key,
  };

  const hashBody = buildHashString(verificationPayload, getEasebuzzResponseHashSequence(), salt);
  const expectedHash = sha512(hashBody);

  return providedHash === expectedHash;
}

export function getRegistrationIdFromCallback(payload: EasebuzzCallbackPayload, queryRegistrationId: string | null) {
  return normalizeString(payload.udf1) || normalizeString(queryRegistrationId);
}

export function getPaymentReferenceFromCallback(payload: EasebuzzCallbackPayload, queryPaymentRef: string | null) {
  return normalizeString(payload.txnid) || normalizeString(payload.udf4) || normalizeString(queryPaymentRef);
}

export function mapCallbackOutcomeToPaymentStatus(outcome: "success" | "failure") {
  return outcome === "success" ? "paid" : "failed";
}
