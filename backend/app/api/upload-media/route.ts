import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { uploadMediaFile } from "@/lib/media/service";
import { getPublicMediaUrl } from "@/lib/media/service";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api-upload-media");

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploaded = await uploadMediaFile({
      userId: session.sub,
      file,
      bucketName: "media",
    });

    const url = getPublicMediaUrl(uploaded.file_path, "media");

    return NextResponse.json({ url });
  } catch (error) {
    logger.error("Media upload error", { error });
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}
