import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";
import { getPublicMediaUrl } from "@/lib/media/service";

const logger = getLogger("past-events-service");

export type PastEventItem = {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
};

const PAST_EVENTS_IMAGE_BUCKET = "pastEvents";

function resolveImageUrl(value: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return getPublicMediaUrl(value, PAST_EVENTS_IMAGE_BUCKET);
}

type PastEventRow = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

function mapPastEventRow(row: PastEventRow): PastEventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: resolveImageUrl(row.image_url),
    createdAt: row.created_at,
  };
}

export async function listPastEvents(): Promise<PastEventItem[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("past_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to list past events", { error });
    throw new Error("Failed to list past events");
  }

  return (data || []).map((row) => mapPastEventRow(row as PastEventRow));
}

export async function getPastEventById(id: string): Promise<PastEventItem | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("past_events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    if (error?.code !== "PGRST116") {
      logger.error("Failed to get past event", { id, error });
    }
    return null;
  }

  return mapPastEventRow(data as PastEventRow);
}

export async function createPastEvent(
  input: Omit<PastEventItem, "id" | "createdAt">,
): Promise<PastEventItem> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("past_events")
    .insert({
      title: input.title || null,
      description: input.description || null,
      image_url: input.imageUrl || null,
    })
    .select()
    .single();

  if (error || !data) {
    logger.error("Failed to create past event", { input, error });
    throw new Error("Failed to create past event");
  }

  return mapPastEventRow(data as PastEventRow);
}

export async function updatePastEvent(
  id: string,
  input: Partial<Omit<PastEventItem, "id" | "createdAt">>,
): Promise<PastEventItem> {
  const supabase = createSupabaseAdminClient();
  const updates: Record<string, any> = {};
  if (input.title !== undefined) updates.title = input.title || null;
  if (input.description !== undefined) updates.description = input.description || null;
  if (input.imageUrl !== undefined) updates.image_url = input.imageUrl || null;

  const { data, error } = await supabase
    .from("past_events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    logger.error("Failed to update past event", { id, input, error });
    throw new Error("Failed to update past event");
  }

  return mapPastEventRow(data as PastEventRow);
}

export async function deletePastEvent(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("past_events")
    .delete()
    .eq("id", id);

  if (error) {
    logger.error("Failed to delete past event", { id, error });
    throw new Error("Failed to delete past event");
  }
}
