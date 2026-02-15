import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const EVENTS_TABLE = process.env.EVENTS_TABLE || "events";

type UpdatedEventStatusRow = {
  id: string;
  event_date: string | null;
  status: string;
};

export async function markPublishedEventsCompleted(beforeIso: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .update({ status: "completed" })
    .eq("status", "published")
    .lt("event_date", beforeIso)
    .is("deleted_at", null)
    .select("id,event_date,status");

  if (error) {
    throw new Error(
      `Unable to mark published events as completed: ${error.message}`,
    );
  }

  return (data || []) as UpdatedEventStatusRow[];
}
