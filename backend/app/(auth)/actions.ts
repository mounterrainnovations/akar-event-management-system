"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearAuthSession, setAuthSession } from "@/lib/auth/session";

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePassword(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function signupAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));

  if (!email || !password) {
    redirect("/signup?error=Email+and+password+are+required");
  }

  if (password.length < 8) {
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
      redirect("/signup?error=An+account+already+exists+for+that+email");
    }
    redirect("/signup?error=Unable+to+create+account");
  }

  await setAuthSession({
    sub: data.id,
    email: data.email,
    role: data.role,
  });

  redirect("/admin");
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));

  if (!email || !password) {
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
    redirect("/login?error=Invalid+email+or+password");
  }

  const isValidPassword = await verifyPassword(password, data.password);
  if (!isValidPassword) {
    redirect("/login?error=Invalid+email+or+password");
  }

  await setAuthSession({
    sub: data.id,
    email: data.email,
    role: data.role,
  });

  redirect("/admin");
}

export async function logoutAction() {
  await clearAuthSession();
  redirect("/login?success=Signed+out+successfully");
}
