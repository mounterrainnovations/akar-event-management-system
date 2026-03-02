"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getLogger } from "@/lib/logger";
import {
  createJourneyItem,
  deleteJourneyItem,
  updateJourneyItem,
} from "@/lib/journey/service";
import { uploadMediaFile } from "@/lib/media/service";

const logger = getLogger("admin-journey-actions");

function parseYear(value: string | null | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 2026;
  }
  return Math.trunc(parsed);
}

export async function createJourneyAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) redirect("/login?error=Please+sign+in+again");

  const title = formData.get("title")?.toString() || "";
  const content = formData.get("content")?.toString() || "";
  const year = parseYear(formData.get("year")?.toString());

  const posterFile = formData.get("posterFile");
  if (!(posterFile instanceof File) || posterFile.size <= 0) {
    redirect("/admin?section=work&error=Poster+image+is+required");
  }

  try {
    const uploaded = await uploadMediaFile({
      userId: session.sub,
      file: posterFile,
      bucketName: "media",
    });

    await createJourneyItem({
      year,
      title,
      content,
      poster: uploaded.file_path,
    });
  } catch (error) {
    logger.error("Failed to create journey item", { error });
    redirect("/admin?section=work&error=Failed+to+create+journey+item");
  }

  redirect("/admin?section=work&success=Journey+item+created");
}

export async function updateJourneyAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) redirect("/login?error=Please+sign+in+again");

  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin?section=work&error=Invalid+journey+item+ID");

  const title = formData.get("title")?.toString();
  const content = formData.get("content")?.toString();
  const yearInput = formData.get("year")?.toString();
  const year = yearInput ? parseYear(yearInput) : undefined;

  let poster: string | undefined;
  const posterFile = formData.get("posterFile");
  if (posterFile instanceof File && posterFile.size > 0) {
    const uploaded = await uploadMediaFile({
      userId: session.sub,
      file: posterFile,
      bucketName: "media",
    });
    poster = uploaded.file_path;
  }

  try {
    await updateJourneyItem(id, {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(year !== undefined && { year }),
      ...(poster !== undefined && { poster }),
    });
  } catch (error) {
    logger.error("Failed to update journey item", { error });
    redirect("/admin?section=work&error=Failed+to+update+journey+item");
  }

  redirect("/admin?section=work&success=Journey+item+updated");
}

export async function deleteJourneyAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) redirect("/login?error=Please+sign+in+again");

  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin?section=work&error=Invalid+journey+item+ID");

  try {
    await deleteJourneyItem(id);
  } catch (error) {
    logger.error("Failed to delete journey item", { error });
    redirect("/admin?section=work&error=Failed+to+delete+journey+item");
  }

  redirect("/admin?section=work&success=Journey+item+deleted");
}
