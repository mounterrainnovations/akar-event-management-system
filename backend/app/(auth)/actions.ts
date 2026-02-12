"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearAuthSession, setAuthSession } from "@/lib/auth/session";
import { getLogger } from "@/lib/logger";

const logger = getLogger("auth-actions");

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePassword(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return "invalid-email";
  }
  const localMasked =
    local.length <= 2 ? `${local[0] ?? "*"}*` : `${local.slice(0, 2)}***`;
  return `${localMasked}@${domain}`;
}

export async function signupAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));
  const emailMasked = maskEmail(email);
  logger.info("Signup attempt", { email: emailMasked });

  if (!email || !password) {
    logger.warn("Signup rejected: missing credentials");
    redirect("/signup?error=Email+and+password+are+required");
  }

  if (password.length < 8) {
    logger.warn("Signup rejected: password too short", { email: emailMasked });
    redirect("/signup?error=Password+must+be+at+least+8+characters");
  }

  const supabase = createSupabaseAdminClient();
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      password: passwordHash,
    })
    .select("id,email,role")
    .single();

  if (error) {
    if (error.code === "23505") {
      logger.warn("Signup rejected: duplicate email", { email: emailMasked });
      redirect("/signup?error=An+account+already+exists+for+that+email");
    }
    logger.error("Signup failed: database error", { email: emailMasked, code: error.code });
    redirect("/signup?error=Unable+to+create+account");
  }

  await setAuthSession({
    sub: data.id,
    email: data.email,
    role: data.role,
  });

  logger.info("Signup successful", { userId: data.id, email: emailMasked, role: data.role });
  redirect("/admin?success=Account+created+successfully");
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));
  const emailMasked = maskEmail(email);
  logger.info("Login attempt", { email: emailMasked });

  if (!email || !password) {
    logger.warn("Login rejected: missing credentials");
    redirect("/login?error=Email+and+password+are+required");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,email,password,role,deleted_at")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    logger.warn("Login rejected: user not found or query failed", {
      email: emailMasked,
      code: error?.code,
    });
    redirect("/login?error=Invalid+email+or+password");
  }

  const isValidPassword = await verifyPassword(password, data.password);
  if (!isValidPassword) {
    logger.warn("Login rejected: password mismatch", { email: emailMasked });
    redirect("/login?error=Invalid+email+or+password");
  }

  await setAuthSession({
    sub: data.id,
    email: data.email,
    role: data.role,
  });

  logger.info("Login successful", { userId: data.id, email: emailMasked, role: data.role });
  redirect("/admin?success=Signed+in+successfully");
}

export async function logoutAction() {
  logger.info("Logout requested");
  await clearAuthSession();
  redirect("/login?success=Signed+out+successfully");
}
