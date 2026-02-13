import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type LeadUser = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

export async function listAllUsers(): Promise<LeadUser[]> {
  const supabase = createSupabaseAdminClient();

  const allUsers: LeadUser[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    for (const user of data.users) {
      allUsers.push({
        id: user.id,
        email: user.email ?? "",
        fullName:
          user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
        createdAt: user.created_at,
      });
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  // Sort by created_at descending (newest first)
  allUsers.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return allUsers;
}
