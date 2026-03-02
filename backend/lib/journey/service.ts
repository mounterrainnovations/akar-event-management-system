import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";
import { getPublicMediaUrl } from "@/lib/media/service";

const logger = getLogger("journey-service");
const JOURNEY_POSTER_BUCKET = "media";

export type JourneyItem = {
  id: string;
  year: number;
  title: string;
  content: string;
  poster: string;
  createdAt: string;
  updatedAt: string | null;
};

type JourneyRow = {
  id: string;
  year: number;
  title: string;
  content: string;
  poster: string;
  created_at: string;
  updated_at: string | null;
};

function resolvePosterUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return getPublicMediaUrl(value, JOURNEY_POSTER_BUCKET);
}

function mapJourneyRow(row: JourneyRow): JourneyItem {
  return {
    id: row.id,
    year: row.year,
    title: row.title,
    content: row.content,
    poster: resolvePosterUrl(row.poster),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listJourneyItems(): Promise<JourneyItem[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("journey")
    .select("*")
    .order("year", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("Failed to list journey items", { error });
    throw new Error("Failed to list journey items");
  }

  return (data || []).map((row) => mapJourneyRow(row as JourneyRow));
}

export async function getJourneyItemById(id: string): Promise<JourneyItem | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("journey")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    if (error?.code !== "PGRST116") {
      logger.error("Failed to get journey item", { id, error });
    }
    return null;
  }

  return mapJourneyRow(data as JourneyRow);
}

export async function createJourneyItem(
  input: Omit<JourneyItem, "id" | "createdAt" | "updatedAt">,
): Promise<JourneyItem> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("journey")
    .insert({
      year: input.year,
      title: input.title,
      content: input.content,
      poster: input.poster,
    })
    .select("*")
    .single();

  if (error || !data) {
    logger.error("Failed to create journey item", { input, error });
    throw new Error("Failed to create journey item");
  }

  return mapJourneyRow(data as JourneyRow);
}

export async function updateJourneyItem(
  id: string,
  input: Partial<Omit<JourneyItem, "id" | "createdAt" | "updatedAt">>,
): Promise<JourneyItem> {
  const supabase = createSupabaseAdminClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.year !== undefined) updates.year = input.year;
  if (input.title !== undefined) updates.title = input.title;
  if (input.content !== undefined) updates.content = input.content;
  if (input.poster !== undefined) updates.poster = input.poster;

  const { data, error } = await supabase
    .from("journey")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    logger.error("Failed to update journey item", { id, input, error });
    throw new Error("Failed to update journey item");
  }

  return mapJourneyRow(data as JourneyRow);
}

export async function deleteJourneyItem(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("journey").delete().eq("id", id);

  if (error) {
    logger.error("Failed to delete journey item", { id, error });
    throw new Error("Failed to delete journey item");
  }
}
