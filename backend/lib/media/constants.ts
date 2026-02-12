export const DEFAULT_MEDIA_BUCKET = "mediaBucket";

export function getMediaBucketName() {
  return process.env.SUPABASE_MEDIA_BUCKET ?? DEFAULT_MEDIA_BUCKET;
}
