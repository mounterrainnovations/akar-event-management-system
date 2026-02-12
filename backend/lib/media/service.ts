import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";
import { getMediaBucketName } from "@/lib/media/constants";

const logger = getLogger("media-service");
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

type UploadMediaInput = {
  userId: string;
  file: File;
};

type MediaRecord = {
  id: string;
  user_id: string;
  bucket_name: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  deleted_at: string | null;
};

let bucketReady = false;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildFilePath(userId: string, originalName: string) {
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const safeName = sanitizeFileName(originalName || "file");
  return `${userId}/${timestamp}-${crypto.randomUUID()}-${safeName}`;
}

async function ensureMediaBucket() {
  if (bucketReady) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const bucketName = getMediaBucketName();

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    logger.error("Failed to create media bucket", { bucketName, message: createError.message });
    throw new Error("Unable to initialize media bucket");
  }

  const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
    public: true,
    fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`,
  });

  if (updateError) {
    logger.warn("Unable to enforce media bucket configuration", {
      bucketName,
      message: updateError.message,
    });
  }

  bucketReady = true;
}

export async function uploadMediaFile(input: UploadMediaInput) {
  const { userId, file } = input;
  const bucketName = getMediaBucketName();

  if (!file || file.size <= 0) {
    throw new Error("File is required");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File is too large");
  }

  await ensureMediaBucket();

  const supabase = createSupabaseAdminClient();
  const filePath = buildFilePath(userId, file.name);
  const fileName = sanitizeFileName(file.name || "upload");
  const mimeType = file.type || "application/octet-stream";
  const fileBytes = await file.arrayBuffer();

  logger.info("Uploading media file", { userId, bucketName, filePath, fileSize: file.size, mimeType });

  const { error: storageError } = await supabase.storage.from(bucketName).upload(filePath, fileBytes, {
    contentType: mimeType,
    upsert: false,
  });

  if (storageError) {
    logger.error("Storage upload failed", { userId, bucketName, filePath, message: storageError.message });
    throw new Error("Unable to upload file");
  }

  const { data: mediaRow, error: mediaError } = await supabase
    .from("media")
    .insert({
      user_id: userId,
      bucket_name: bucketName,
      file_path: filePath,
      file_name: fileName,
      mime_type: mimeType,
      file_size: file.size,
    })
    .select("*")
    .single<MediaRecord>();

  if (mediaError) {
    logger.error("Media record insert failed, rolling back object", {
      userId,
      bucketName,
      filePath,
      message: mediaError.message,
    });
    await supabase.storage.from(bucketName).remove([filePath]);
    throw new Error("Unable to persist media metadata");
  }

  logger.info("Media upload successful", { mediaId: mediaRow.id, userId, bucketName, filePath });
  return mediaRow;
}

export async function listMediaForUser(userId: string, limit = 50) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<MediaRecord[]>();

  if (error) {
    logger.error("Failed to list media", { userId, message: error.message });
    throw new Error("Unable to fetch media");
  }

  return data;
}

export function getPublicMediaUrl(filePath: string, bucketNameOverride?: string) {
  const supabase = createSupabaseAdminClient();
  const bucketName = bucketNameOverride ?? getMediaBucketName();
  return supabase.storage.from(bucketName).getPublicUrl(filePath).data.publicUrl;
}
