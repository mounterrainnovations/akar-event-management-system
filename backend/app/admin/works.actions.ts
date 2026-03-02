"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getLogger } from "@/lib/logger";
import {
  createWork,
  updateWork,
  deleteWork,
  type WorkCategory,
} from "@/lib/works/service";
import { uploadMediaFile } from "@/lib/media/service";

const logger = getLogger("admin-works-actions");

export async function createWorkAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) redirect("/login?error=Please+sign+in+again");

  const title = formData.get("title")?.toString() || "";
  const author = formData.get("author")?.toString() || "";
  const content = formData.get("content")?.toString() || "";
  const category = (formData.get("category")?.toString() ||
    "article") as WorkCategory;
  const isPublished = formData.get("isPublished") === "true";

  let coverImageUrl: string | null = null;
  const coverFile = formData.get("coverFile");
  if (coverFile instanceof File && coverFile.size > 0) {
    const uploaded = await uploadMediaFile({
      userId: session.sub,
      file: coverFile,
      bucketName: "media",
    });
    coverImageUrl = uploaded.file_path; // Storing the file path to retrieve URL later, or direct URL.
  }

  try {
    await createWork({
      title,
      author,
      content,
      category,
      coverImageUrl,
      isPublished,
    });
  } catch (error) {
    logger.error("Failed to create work", { error });
    redirect("/admin?section=work&error=Failed+to+create");
  }

  redirect("/admin?section=work&success=Work+created");
}

export async function updateWorkAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) redirect("/login?error=Please+sign+in+again");

  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin?section=work&error=Invalid+ID");

  const title = formData.get("title")?.toString();
  const author = formData.get("author")?.toString();
  const content = formData.get("content")?.toString();
  const category = formData.get("category") as WorkCategory | undefined;
  const isPublished = formData.get("isPublished") === "true";

  let coverImageUrl: string | undefined = undefined;
  const coverFile = formData.get("coverFile");
  if (coverFile instanceof File && coverFile.size > 0) {
    const uploaded = await uploadMediaFile({
      userId: session.sub,
      file: coverFile,
      bucketName: "media",
    });
    coverImageUrl = uploaded.file_path;
  }

  try {
    await updateWork(id, {
      ...(title && { title }),
      ...(author && { author }),
      ...(content && { content }),
      ...(category && { category }),
      ...(coverImageUrl && { coverImageUrl }),
      isPublished,
    });
  } catch (error) {
    logger.error("Failed to update work", { error });
    redirect("/admin?section=work&error=Failed+to+update");
  }

  redirect("/admin?section=work&success=Work+updated");
}

export async function deleteWorkAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) redirect("/login?error=Please+sign+in+again");

  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin?section=work&error=Invalid+ID");

  try {
    await deleteWork(id);
  } catch (error) {
    logger.error("Failed to delete work", { error });
    redirect("/admin?section=work&error=Failed+to+delete");
  }

  redirect("/admin?section=work&success=Work+deleted");
}
