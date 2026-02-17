import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";
import { getPublicMediaUrl, uploadMediaFile } from "@/lib/media/service";
import {
  getSectionRules,
  type WebsiteSection,
} from "@/lib/media/website-sections";

const logger = getLogger("website-media-service");

type WebsiteMediaRow = {
  id: string;
  media_id: string;
  section: WebsiteSection;
  display_order: number;
  is_active: boolean;
  title: string | null;
  description: string | null;
  deleted_at: string | null;
  media: {
    id: string;
    user_id: string;
    bucket_name: string;
    file_path: string;
    file_name: string;
    mime_type: string;
    file_size: number;
    deleted_at: string | null;
  } | null;
};

type WebsiteMediaRowWithMedia = Omit<WebsiteMediaRow, "media"> & {
  media: NonNullable<WebsiteMediaRow["media"]>;
};

export type WebsiteMediaItem = {
  id: string;
  mediaId: string;
  section: WebsiteSection;
  displayOrder: number;
  isActive: boolean;
  fileName: string;
  mimeType: string;
  fileSize: number;
  previewUrl: string;
  title: string | null;
  description: string | null;
};

export type WebsiteSectionState = {
  section: WebsiteSection;
  totalCount: number;
  activeCount: number;
  minRequired: number;
  maxAllowed: number;
  items: WebsiteMediaItem[];
};

export type PublicWebsiteSectionMedia = {
  section: WebsiteSection;
  items: WebsiteMediaItem[];
  meta: {
    total: number;
    active: number;
    minRequired: number;
    maxAllowed: number;
  };
};

async function getSectionCounts(section: WebsiteSection) {
  const supabase = createSupabaseAdminClient();
  const [
    { count: totalCount, error: totalError },
    { count: activeCount, error: activeError },
  ] = await Promise.all([
    supabase
      .from("website_media")
      .select("*", { count: "exact", head: true })
      .eq("section", section)
      .is("deleted_at", null),
    supabase
      .from("website_media")
      .select("*", { count: "exact", head: true })
      .eq("section", section)
      .is("deleted_at", null)
      .eq("is_active", true),
  ]);

  if (totalError || activeError) {
    logger.error("Failed to count section media", {
      section,
      totalError: totalError?.message,
      activeError: activeError?.message,
    });
    throw new Error("Unable to validate section limits");
  }

  return {
    totalCount: totalCount ?? 0,
    activeCount: activeCount ?? 0,
  };
}

async function getNextDisplayOrder(section: WebsiteSection) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("website_media")
    .select("display_order")
    .eq("section", section)
    .is("deleted_at", null)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ display_order: number }>();

  if (error) {
    logger.error("Failed to fetch display order", {
      section,
      message: error.message,
    });
    throw new Error("Unable to compute display order");
  }

  return (data?.display_order ?? -1) + 1;
}

async function getWebsiteMediaRowForMutation(
  websiteMediaId: string,
): Promise<WebsiteMediaRowWithMedia> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("website_media")
    .select(
      "id,media_id,section,display_order,is_active,deleted_at,media:media_id(id,user_id,bucket_name,file_path,file_name,mime_type,file_size,deleted_at)",
    )
    .eq("id", websiteMediaId)
    .is("deleted_at", null)
    .single<WebsiteMediaRow>();

  if (error || !data || !data.media) {
    logger.warn("Website media row not found for mutation", {
      websiteMediaId,
      message: error?.message,
    });
    throw new Error("Media item not found");
  }

  return {
    ...data,
    media: data.media,
  };
}

function ensureImageFile(file: File) {
  if (!file.type.toLowerCase().startsWith("image/")) {
    throw new Error("Only image uploads are allowed for this section");
  }
}

export async function uploadFilesToSection(params: {
  userId: string;
  section: WebsiteSection;
  files: File[];
  title?: string;
  description?: string;
}) {
  const { userId, section, files, title, description } = params;
  const rules = getSectionRules(section);
  const validFiles = files.filter((file) => file.size > 0);

  if (validFiles.length === 0) {
    throw new Error("Please select one or more files");
  }

  if (rules.imagesOnly) {
    validFiles.forEach(ensureImageFile);
  }

  const { totalCount } = await getSectionCounts(section);
  if (totalCount + validFiles.length > rules.maxImages) {
    throw new Error(`Cannot exceed ${rules.maxImages} files in ${rules.label}`);
  }

  let nextDisplayOrder = await getNextDisplayOrder(section);
  const supabase = createSupabaseAdminClient();

  const bucketName = section === "members" ? "members" : undefined;

  for (const file of validFiles) {
    const media = await uploadMediaFile({ userId, file, bucketName });
    const { error } = await supabase.from("website_media").insert({
      media_id: media.id,
      section,
      display_order: nextDisplayOrder,
      is_active: true,
      title: title || null,
      description: description || null,
    });

    if (error) {
      logger.error("Failed to map media to section", {
        mediaId: media.id,
        section,
        message: error.message,
      });
      throw new Error("Unable to assign uploaded file to section");
    }

    nextDisplayOrder += 1;
  }

  logger.info("Section upload completed", {
    userId,
    section,
    fileCount: validFiles.length,
  });
}

export async function listSectionMediaState(params: {
  section: WebsiteSection;
}) {
  const { section } = params;
  const rules = getSectionRules(section);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("website_media")
    .select(
      "id,media_id,section,display_order,is_active,deleted_at,media:media_id(id,user_id,bucket_name,file_path,file_name,mime_type,file_size,deleted_at)",
    )
    .eq("section", section)
    .is("deleted_at", null)
    .is("media.deleted_at", null)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<WebsiteMediaRow[]>();

  if (error) {
    logger.error("Failed to list section media", {
      section,
      message: error.message,
    });
    throw new Error("Unable to load media section");
  }

  const hydratedItems = data
    .filter((row) => row.media)
    .map((row) => {
      const media = row.media!;
      const previewUrl = getPublicMediaUrl(media.file_path, media.bucket_name);
      return {
        id: row.id,
        mediaId: row.media_id,
        section: row.section,
        displayOrder: row.display_order,
        isActive: row.is_active,
        fileName: media.file_name,
        mimeType: media.mime_type,
        fileSize: media.file_size,
        previewUrl,
        title: row.title,
        description: row.description,
      } satisfies WebsiteMediaItem;
    });

  const totalCount = hydratedItems.length;
  const activeCount = hydratedItems.filter((item) => item.isActive).length;

  return {
    section,
    totalCount,
    activeCount,
    minRequired: rules.minImages,
    maxAllowed: rules.maxImages,
    items: hydratedItems,
  } satisfies WebsiteSectionState;
}

export async function listPublicSectionMedia(params: {
  section: WebsiteSection;
  onlyActive?: boolean;
  limit?: number;
}) {
  const { section, onlyActive = true, limit } = params;
  const rules = getSectionRules(section);
  const cappedLimit = Math.max(
    1,
    Math.min(limit ?? rules.maxImages, rules.maxImages),
  );
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("website_media")
    .select(
      "id,media_id,section,display_order,is_active,deleted_at,media:media_id(id,user_id,bucket_name,file_path,file_name,mime_type,file_size,deleted_at)",
    )
    .eq("section", section)
    .is("deleted_at", null)
    .is("media.deleted_at", null)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(cappedLimit);

  if (onlyActive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.returns<WebsiteMediaRow[]>();

  if (error) {
    logger.error("Failed to list public section media", {
      section,
      message: error.message,
    });
    throw new Error("Unable to load section media");
  }

  const items = data
    .filter((row) => row.media)
    .map((row) => {
      const media = row.media!;
      return {
        id: row.id,
        mediaId: row.media_id,
        section: row.section,
        displayOrder: row.display_order,
        isActive: row.is_active,
        fileName: media.file_name,
        mimeType: media.mime_type,
        fileSize: media.file_size,
        previewUrl: getPublicMediaUrl(media.file_path, media.bucket_name),
        title: row.title,
        description: row.description,
      } satisfies WebsiteMediaItem;
    });

  const activeCount = items.filter((item) => item.isActive).length;

  return {
    section,
    items,
    meta: {
      total: items.length,
      active: activeCount,
      minRequired: rules.minImages,
      maxAllowed: rules.maxImages,
    },
  } satisfies PublicWebsiteSectionMedia;
}

export async function toggleSectionMediaVisibility(params: {
  websiteMediaId: string;
}) {
  const { websiteMediaId } = params;
  const row = await getWebsiteMediaRowForMutation(websiteMediaId);

  const rules = getSectionRules(row.section);
  const supabase = createSupabaseAdminClient();
  const nextActiveState = !row.is_active;

  if (!nextActiveState) {
    const { activeCount } = await getSectionCounts(row.section);
    if (activeCount <= rules.minImages) {
      throw new Error(
        `At least ${rules.minImages} active images are required in ${rules.label}`,
      );
    }
  }

  const { error } = await supabase
    .from("website_media")
    .update({ is_active: nextActiveState })
    .eq("id", websiteMediaId);

  if (error) {
    logger.error("Failed to toggle section media visibility", {
      websiteMediaId,
      section: row.section,
      message: error.message,
    });
    throw new Error("Unable to update media visibility");
  }

  return { section: row.section };
}

export async function deleteSectionMediaItem(params: {
  websiteMediaId: string;
}) {
  const { websiteMediaId } = params;
  const row = await getWebsiteMediaRowForMutation(websiteMediaId);

  const rules = getSectionRules(row.section);
  if (row.is_active) {
    const { activeCount } = await getSectionCounts(row.section);
    if (activeCount <= rules.minImages) {
      throw new Error(
        `At least ${rules.minImages} active images are required in ${rules.label}`,
      );
    }
  }

  const supabase = createSupabaseAdminClient();
  const { error: storageDeleteError } = await supabase.storage
    .from(row.media.bucket_name)
    .remove([row.media.file_path]);

  if (storageDeleteError) {
    logger.error("Failed to delete storage object", {
      mediaId: row.media_id,
      bucketName: row.media.bucket_name,
      filePath: row.media.file_path,
      message: storageDeleteError.message,
    });
    throw new Error("Unable to delete file from storage");
  }

  const deletedAt = new Date().toISOString();
  const { error: softDeleteSectionError } = await supabase
    .from("website_media")
    .update({
      deleted_at: deletedAt,
      is_active: false,
    })
    .eq("id", websiteMediaId)
    .is("deleted_at", null);

  if (softDeleteSectionError) {
    logger.error("Failed to soft delete section mapping", {
      websiteMediaId,
      section: row.section,
      message: softDeleteSectionError.message,
    });
    throw new Error("Unable to delete media from section");
  }

  const { count: remainingRefs, error: refsError } = await supabase
    .from("website_media")
    .select("*", { count: "exact", head: true })
    .eq("media_id", row.media_id)
    .is("deleted_at", null);

  if (refsError) {
    logger.error("Failed to count media references", {
      mediaId: row.media_id,
      message: refsError.message,
    });
    return { section: row.section };
  }

  if ((remainingRefs ?? 0) > 0) {
    return { section: row.section };
  }

  const { error: softDeleteError } = await supabase
    .from("media")
    .update({ deleted_at: deletedAt })
    .eq("id", row.media_id)
    .is("deleted_at", null);

  if (softDeleteError) {
    logger.error("Failed to soft delete media row after section delete", {
      mediaId: row.media_id,
      message: softDeleteError.message,
    });
    return { section: row.section };
  }

  logger.info("Soft deleted media and section mapping after storage delete", {
    websiteMediaId,
    mediaId: row.media_id,
    section: row.section,
  });

  return { section: row.section };
}
