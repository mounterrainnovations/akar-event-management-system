import { getLogger } from "@/lib/logger";

const logger = getLogger("easebuzz-config");

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    logger.error("Missing required environment variable", { name });
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function getOptionalEnv(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

function getOptionalBoolean(name: string, fallback: boolean) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  return value.toLowerCase() === "true";
}

export function getEasebuzzKey() {
  return requireEnv("EASEBUZZ_KEY");
}

export function getEasebuzzSalt() {
  return requireEnv("EASEBUZZ_SALT");
}

export function getEasebuzzBaseUrl() {
  return getOptionalEnv("EASEBUZZ_BASE_URL", "https://testpay.easebuzz.in");
}

export function getEasebuzzInitiatePath() {
  return getOptionalEnv("EASEBUZZ_INITIATE_PATH", "/payment/initiateLink");
}

export function getEasebuzzRequestHashSequence() {
  return getOptionalEnv(
    "EASEBUZZ_REQUEST_HASH_SEQUENCE",
    "key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||",
  );
}

export function getEasebuzzResponseHashSequence() {
  return getOptionalEnv(
    "EASEBUZZ_RESPONSE_HASH_SEQUENCE",
    "status|||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key",
  );
}

export function shouldVerifyEasebuzzCallbackHash() {
  return getOptionalBoolean("EASEBUZZ_VERIFY_CALLBACK_HASH", false);
}

export function getPaymentCallbackBaseUrl() {
  return process.env.PAYMENT_CALLBACK_BASE_URL?.trim() || null;
}

export function getPaymentAllowedOrigins() {
  const configured = process.env.PAYMENT_ALLOWED_ORIGINS?.trim();
  if (!configured) {
    return ["http://localhost:3000", "http://localhost:3001"];
  }

  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
