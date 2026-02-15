import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getLogger } from "@/lib/logger";

export const SESSION_COOKIE_NAME = "hw_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const logger = getLogger("auth-session");

export type SessionPayload = {
  sub: string;
  email: string;
  role: string;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    logger.error("Missing required environment variable", { name: "AUTH_SESSION_SECRET" });
    throw new Error("Missing AUTH_SESSION_SECRET");
  }
  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function createSessionToken(payload: SessionPayload) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    logger.warn("Session token malformed");
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const provided = Buffer.from(signature, "base64url");
  const expected = Buffer.from(expectedSignature, "base64url");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    logger.warn("Session token signature mismatch");
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;
  } catch {
    logger.warn("Session token payload parse failure");
    return null;
  }

  if (!payload.exp || payload.exp <= Date.now()) {
    logger.info("Session token expired");
    return null;
  }

  return payload;
}

export async function setAuthSession(user: Omit<SessionPayload, "exp">) {
  const cookieStore = await cookies();
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const token = createSessionToken(payload);

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    maxAge: SESSION_TTL_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  logger.info("Session created", { userId: user.sub, role: user.role });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  logger.info("Session cleared");
}

export async function getAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}
