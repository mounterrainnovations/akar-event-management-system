"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getLogger } from "@/lib/logger";
import {
  createPastEvent,
  updatePastEvent,
  deletePastEvent,
} from "@/lib/past-events/service";
import { uploadMediaFile } from "@/lib/media/service";

const logger = getLogger("admin-past-events-actions");

export async function createPastEventAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) redirect("/login?error=Please+sign+in+again");

  const title = formData.get("title")?.toString() || null;
  const description = formData.get("description")?.toString() || null;

  let imageUrl: string | null = null;
  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    const uploaded = await uploadMediaFile({
      userId: session.sub,
      file: imageFile,
      bucketName: "pastEvents",
    });
    imageUrl = uploaded.file_path;
  }

  try {
    await createPastEvent({
      title,
      description,
      imageUrl,
    });
  } catch (error) {
    logger.error("Failed to create past event", { error });
    redirect("/admin?section=media&mediaCategory=past-events&error=Failed+to+create");
  }

  redirect("/admin?section=media&mediaCategory=past-events&success=Past+event+created");
}

export async function updatePastEventAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) redirect("/login?error=Please+sign+in+again");

  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin?section=media&mediaCategory=past-events&error=Invalid+ID");

  const title = formData.get("title")?.toString() || null;
  const description = formData.get("description")?.toString() || null;

  let imageUrl: string | undefined = undefined;
  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    const uploaded = await uploadMediaFile({
      userId: session.sub,
      file: imageFile,
      bucketName: "pastEvents",
    });
    imageUrl = uploaded.file_path;
  }

  try {
    await updatePastEvent(id, {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(imageUrl !== undefined && { imageUrl }),
    });
  } catch (error) {
    logger.error("Failed to update past event", { error });
    redirect("/admin?section=media&mediaCategory=past-events&error=Failed+to+update");
  }

  redirect("/admin?section=media&mediaCategory=past-events&success=Past+event+updated");
}

export async function deletePastEventAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) redirect("/login?error=Please+sign+in+again");

  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin?section=media&mediaCategory=past-events&error=Invalid+ID");

  try {
    await deletePastEvent(id);
  } catch (error) {
    logger.error("Failed to delete past event", { error });
    redirect("/admin?section=media&mediaCategory=past-events&error=Failed+to+delete");
  }

  redirect("/admin?section=media&mediaCategory=past-events&success=Past+event+deleted");
}
