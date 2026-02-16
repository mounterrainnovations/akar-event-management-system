import { createHash, randomUUID } from "node:crypto";
import {
  getEasebuzzBaseUrl,
  getEasebuzzInitiatePath,
  getEasebuzzKey,
  getEasebuzzRetrieveUrl,
  getEasebuzzSalt,
  getPaymentCallbackBaseUrl,
  getPaymentResultBaseUrl,
} from "@/lib/payments/easebuzz/config";
import { getLogger } from "@/lib/logger";

const logger = getLogger("easebuzz-service");

function shouldLogFullPaymentPayload() {
  return process.env.PAYMENT_FLOW_LOG_FULL_PAYLOAD === "true";
}

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

export type EasebuzzCallbackFlow =
  | "success"
  | "failure"
  | "pending"
  | "unknown";

type ResolvedEasebuzzFlow = Exclude<EasebuzzCallbackFlow, "unknown">;

export const REQUIRED_EASEBUZZ_UDF_KEYS = [
  "udf1",
  "udf2",
  "udf3",
  "udf4",
  "udf5",
  "udf6",
  "udf7",
  "udf8",
  "udf9",
  "udf10",
] as const;

export type EasebuzzCallbackDto = {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  udf1: string;
  udf2: string;
  udf3: string;
  udf4: string;
  udf5: string;
  udf6: string;
  udf7: string;
  udf8: string;
  udf9: string;
  udf10: string;
  hash: string;
  status: string;
  mode: string;
  error: string;
  errorMessage: string;
};

export type EasebuzzCallbackHashVerification = {
  valid: boolean;
  expectedHash: string;
  receivedHash: string;
  reason?: string;
};

function sha512(value: string) {
  return createHash("sha512").update(value, "utf8").digest("hex");
}

function truncate(value: string, max = 160) {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}...`;
}

function maskValue(value: string, keepStart = 3, keepEnd = 2, maskChar = "*") {
  if (!value) {
    return "";
  }
  if (value.length <= keepStart + keepEnd) {
    return maskChar.repeat(value.length);
  }
  return `${value.slice(0, keepStart)}${maskChar.repeat(
    value.length - keepStart - keepEnd,
  )}${value.slice(-keepEnd)}`;
}

function getEmailDomain(email: string) {
  const atIndex = email.indexOf("@");
  if (atIndex === -1 || atIndex === email.length - 1) {
    return "";
  }
  return email.slice(atIndex + 1).toLowerCase();
}

function buildInitiatePayloadLog(payload: Record<string, string>) {
  return {
    txnid: payload.txnid,
    txnidLength: payload.txnid?.length || 0,
    amount: payload.amount,
    productinfoLength: payload.productinfo?.length || 0,
    firstnameLength: payload.firstname?.length || 0,
    emailDomain: getEmailDomain(payload.email || ""),
    phoneLast4: (payload.phone || "").slice(-4),
    surlHost: (() => {
      try {
        return new URL(payload.surl).host;
      } catch {
        return "";
      }
    })(),
    furlHost: (() => {
      try {
        return new URL(payload.furl).host;
      } catch {
        return "";
      }
    })(),
    showPaymentMode: payload.show_payment_mode || "",
    udfLengths: {
      udf1: payload.udf1?.length || 0,
      udf2: payload.udf2?.length || 0,
      udf3: payload.udf3?.length || 0,
      udf4: payload.udf4?.length || 0,
    },
    keyMasked: maskValue(payload.key || "", 4, 2),
    hashLength: payload.hash?.length || 0,
    productinfo: payload.productinfo,
    firstname: payload.firstname,
    email: payload.email,
    phone: payload.phone,
    surl: payload.surl,
    furl: payload.furl,
    udf1: payload.udf1,
    udf2: payload.udf2,
    udf3: payload.udf3,
    udf4: payload.udf4,
  };
}

function summarizeInitiateResponseData(data: unknown) {
  if (typeof data === "string") {
    return {
      dataType: "text",
      dataPreview: truncate(data.replace(/\s+/g, " ").trim()),
    };
  }

  if (!data || typeof data !== "object") {
    return {
      dataType: typeof data,
      dataPreview: String(data),
    };
  }

  const record = data as Record<string, unknown>;
  return {
    dataType: "json",
    status: record.status ?? null,
    msg: typeof record.msg === "string" ? truncate(record.msg) : null,
    message:
      typeof record.message === "string" ? truncate(record.message) : null,
    error: typeof record.error === "string" ? truncate(record.error) : null,
    error_desc:
      typeof record.error_desc === "string"
        ? truncate(record.error_desc)
        : null,
    dataField:
      typeof record.data === "string"
        ? truncate(record.data)
        : (record.data ?? null),
  };
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(
      ([key, fieldValue]) => [
        key,
        fieldValue === null || fieldValue === undefined
          ? ""
          : String(fieldValue),
      ],
    ),
  );
}

function pickRetrievePayloadCandidate(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const messagePayload = record.msg;
  if (Array.isArray(messagePayload) && messagePayload.length > 0) {
    return pickRetrievePayloadCandidate(messagePayload[0]);
  }
  if (messagePayload && typeof messagePayload === "object") {
    return pickRetrievePayloadCandidate(messagePayload);
  }

  if (
    typeof record.txnid === "string" ||
    typeof record.hash === "string" ||
    typeof record.status === "string"
  ) {
    return record;
  }

  const nestedData = record.data;
  if (nestedData && typeof nestedData === "object") {
    if (Array.isArray(nestedData) && nestedData.length > 0) {
      return pickRetrievePayloadCandidate(nestedData[0]);
    }
    return pickRetrievePayloadCandidate(nestedData);
  }

  return record;
}

function normalizeAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  return amount.toFixed(2);
}

function hardcodeProductInfo(productInfo: string) {
  return "ProductInfo";
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

export function buildBookingResultUrl(args: {
  flow: ResolvedEasebuzzFlow;
  callbackStatus?: string;
  transactionId?: string | null;
  registrationId?: string | null;
  message?: string | null;
}) {
  const baseUrl = new URL(getPaymentResultBaseUrl());
  const pathByFlow: Record<ResolvedEasebuzzFlow, string> = {
    success: "/booking/success",
    failure: "/booking/failure",
    pending: "/booking/pending",
  };

  const url = new URL(pathByFlow[args.flow], baseUrl);
  if (args.callbackStatus) {
    url.searchParams.set("status", args.callbackStatus);
  }
  if (args.transactionId) {
    url.searchParams.set("txnid", args.transactionId);
  }
  if (args.registrationId) {
    url.searchParams.set("registrationId", args.registrationId);
  }
  if (args.message) {
    url.searchParams.set("message", args.message);
  }

  return url;
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
    productinfo: hardcodeProductInfo(args.input.productInfo),
    firstname: args.input.firstName,
    email: args.input.email,
    phone: args.input.phone,
    surl: callbackUrls.callback,
    furl: callbackUrls.callback,
    udf1: args.input.registrationId || "",
    udf2: args.input.eventId || "",
    udf3: args.input.userId || "",
    udf4: transactionId,
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

export function extractEasebuzzCallbackData(
  payload: Record<string, string>,
): EasebuzzCallbackDto {
  return {
    key: payload.key ?? "",
    txnid: payload.txnid ?? "",
    amount: payload.amount ?? "",
    productinfo: payload.productinfo ?? "",
    firstname: payload.firstname ?? "",
    email: payload.email ?? "",
    phone: payload.phone ?? "",
    surl: payload.surl ?? "",
    furl: payload.furl ?? "",
    udf1: payload.udf1 ?? "",
    udf2: payload.udf2 ?? "",
    udf3: payload.udf3 ?? "",
    udf4: payload.udf4 ?? "",
    udf5: payload.udf5 ?? "",
    udf6: payload.udf6 ?? "",
    udf7: payload.udf7 ?? "",
    udf8: payload.udf8 ?? "",
    udf9: payload.udf9 ?? "",
    udf10: payload.udf10 ?? "",
    hash: payload.hash ?? "",
    status: payload.status ?? "",
    mode: payload.mode ?? "",
    error: payload.error ?? "",
    errorMessage: payload.error_message ?? payload.error_Message ?? "",
  };
}

export function getMissingEasebuzzUdfKeys(payload: Record<string, string>) {
  return REQUIRED_EASEBUZZ_UDF_KEYS.filter(
    (key) => !Object.prototype.hasOwnProperty.call(payload, key),
  );
}

export function resolveEasebuzzCallbackFlow(
  status: string,
): EasebuzzCallbackFlow {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "success") {
    return "success";
  }

  if (
    normalizedStatus === "failure" ||
    normalizedStatus === "dropped" ||
    normalizedStatus === "usercancelled" ||
    normalizedStatus === "bounced"
  ) {
    return "failure";
  }

  if (
    normalizedStatus === "pending" ||
    normalizedStatus === "initiated" ||
    normalizedStatus === "initated"
  ) {
    return "pending";
  }

  return "unknown";
}

function buildEasebuzzCallbackHashString(
  dto: EasebuzzCallbackDto,
  merchantKey: string,
) {
  const salt = getEasebuzzSalt();
  return [
    salt,
    dto.status,
    dto.udf10,
    dto.udf9,
    dto.udf8,
    dto.udf7,
    dto.udf6,
    dto.udf5,
    dto.udf4,
    dto.udf3,
    dto.udf2,
    dto.udf1,
    dto.email,
    dto.firstname,
    dto.productinfo,
    dto.amount,
    dto.txnid,
    merchantKey,
  ].join("|");
}

export function verifyEasebuzzCallbackHash(
  dto: EasebuzzCallbackDto,
): EasebuzzCallbackHashVerification {
  const merchantKey = getEasebuzzKey();
  if (!dto.key) {
    return {
      valid: false,
      expectedHash: "",
      receivedHash: dto.hash.toLowerCase(),
      reason: "missing_key",
    };
  }

  if (dto.key !== merchantKey) {
    return {
      valid: false,
      expectedHash: "",
      receivedHash: dto.hash.toLowerCase(),
      reason: "key_mismatch",
    };
  }

  const receivedHash = dto.hash.toLowerCase();
  if (!receivedHash) {
    return {
      valid: false,
      expectedHash: "",
      receivedHash,
      reason: "missing_hash",
    };
  }

  const expectedHash = sha512(
    buildEasebuzzCallbackHashString(dto, merchantKey),
  );
  return {
    valid: expectedHash === receivedHash,
    expectedHash,
    receivedHash,
    reason: expectedHash === receivedHash ? undefined : "hash_mismatch",
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
    request: buildInitiatePayloadLog(payload),
    ...(shouldLogFullPaymentPayload()
      ? {
          fullRequestPayload: payload,
        }
      : {}),
  });

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formPayload,
    });
  } catch (error) {
    logger.error("Easebuzz initiate network error", {
      endpoint,
      txnid: payload.txnid,
      message: error instanceof Error ? error.message : "Unknown error",
      code:
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: unknown }).code)
          : undefined,
    });
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  logger.info("Easebuzz initiate response payload", {
    endpoint,
    txnid: payload.txnid,
    httpStatus: response.status,
    ok: response.ok,
    contentType,
    response: summarizeInitiateResponseData(data),
    ...(shouldLogFullPaymentPayload()
      ? {
          fullResponsePayload: data,
        }
      : {}),
  });

  return {
    ok: response.ok,
    status: response.status,
    endpoint,
    data,
  };
}

export async function retrieveEasebuzzTransaction(input: { txnid: string }) {
  const key = getEasebuzzKey();
  const salt = getEasebuzzSalt();
  const hash = sha512(`${key}|${input.txnid}|${salt}`);
  const endpoint = getEasebuzzRetrieveUrl();
  const formPayload = new URLSearchParams({
    key,
    txnid: input.txnid,
    hash,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formPayload,
  });

  const contentType = response.headers.get("content-type") || "";
  let payload: Record<string, string> = {};
  if (contentType.includes("application/json")) {
    const jsonBody = await response.json();
    payload = toStringRecord(pickRetrievePayloadCandidate(jsonBody));
  } else {
    const raw = await response.text();
    try {
      payload = toStringRecord(pickRetrievePayloadCandidate(JSON.parse(raw)));
    } catch {
      const params = new URLSearchParams(raw);
      payload = Object.fromEntries(params.entries());
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    endpoint,
    requestPayload: {
      key,
      txnid: input.txnid,
      hash,
    },
    payload,
  };
}
