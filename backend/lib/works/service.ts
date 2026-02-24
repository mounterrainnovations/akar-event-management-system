import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";
import { getPublicMediaUrl } from "@/lib/media/service";

const logger = getLogger("work-service");

export type WorkCategory = "upcoming" | "past" | "article";

export type WorkItem = {
  id: string;
  title: string;
  author: string;
  content: string;
  category: WorkCategory;
  coverImageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

const WORK_COVER_BUCKET = "media";

function resolveCoverImageUrl(value: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return getPublicMediaUrl(value, WORK_COVER_BUCKET);
}

type WorkRow = {
  id: string;
  title: string;
  author: string;
  content: string;
  category: WorkCategory;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

function mapWorkRow(row: WorkRow): WorkItem {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    content: row.content,
    category: row.category,
    coverImageUrl: resolveCoverImageUrl(row.cover_image_url),
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWorks(options?: {
  category?: WorkCategory;
  includeDrafts?: boolean;
}): Promise<WorkItem[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("works")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (options?.category) {
    query = query.eq("category", options.category);
  }
  if (!options?.includeDrafts) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("Failed to list works", { error });
    throw new Error("Failed to list works");
  }

  return (data || []).map((row) => mapWorkRow(row as WorkRow));
}

export async function getWorkById(id: string): Promise<WorkItem | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("works")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    if (error?.code !== "PGRST116") {
      logger.error("Failed to get work", { id, error });
    }
    return null;
  }

  return mapWorkRow(data as WorkRow);
}

export async function createWork(
  input: Omit<WorkItem, "id" | "createdAt" | "updatedAt">,
): Promise<WorkItem> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("works")
    .insert({
      title: input.title,
      author: input.author,
      content: input.content,
      category: input.category,
      cover_image_url: input.coverImageUrl,
      is_published: input.isPublished,
    })
    .select()
    .single();

  if (error || !data) {
    logger.error("Failed to create work", { input, error });
    throw new Error("Failed to create work");
  }

  return mapWorkRow(data as WorkRow);
}

export async function updateWork(
  id: string,
  input: Partial<Omit<WorkItem, "id" | "createdAt" | "updatedAt">>,
): Promise<WorkItem> {
  const supabase = createSupabaseAdminClient();
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) updates.title = input.title;
  if (input.author !== undefined) updates.author = input.author;
  if (input.content !== undefined) updates.content = input.content;
  if (input.category !== undefined) updates.category = input.category;
  if (input.coverImageUrl !== undefined)
    updates.cover_image_url = input.coverImageUrl;
  if (input.isPublished !== undefined) updates.is_published = input.isPublished;

  const { data, error } = await supabase
    .from("works")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    logger.error("Failed to update work", { id, input, error });
    throw new Error("Failed to update work");
  }

  return mapWorkRow(data as WorkRow);
}

export async function deleteWork(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("works")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    logger.error("Failed to delete work", { id, error });
    throw new Error("Failed to delete work");
  }
}
