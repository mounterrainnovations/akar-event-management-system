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

export function getEasebuzzPaymentPath() {
  return getOptionalEnv("EASEBUZZ_PAY_PATH", "/pay");
}

export function getEasebuzzRetrieveUrl() {
  return getOptionalEnv(
    "EASEBUZZ_RETRIEVE_URL",
    "https://testdashboard.easebuzz.in/transaction/v2.1/retrieve",
  );
}

export function getPaymentCallbackBaseUrl() {
  return process.env.PAYMENT_CALLBACK_BASE_URL?.trim() || null;
}

export function getPaymentResultBaseUrl() {
  // Fallback
  if (!process.env.FRONTEND_BASE_URL?.trim()) {
    logger.error("FRONTEND_BASE_URL not present in ENV");
    return "http://localhost:3001";
  }

  return process.env.ENV === "dev"
    ? "http://localhost:3001"
    : process.env.FRONTEND_BASE_URL;
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
