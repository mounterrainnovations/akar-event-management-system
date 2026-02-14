import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type LeadUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  createdAt: string;
};

export async function listAllUsers(): Promise<LeadUser[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, phone, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list users from database: ${error.message}`);
  }

  return data.map((user) => ({
    id: user.id,
    email: user.email ?? "",
    fullName: user.full_name ?? "",
    phone: user.phone,
    createdAt: user.created_at || new Date().toISOString(),
  }));
}
