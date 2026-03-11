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

  const imagesFiles = formData.getAll("images");
  const images: string[] = [];
  for (const file of imagesFiles) {
    if (file instanceof File && file.size > 0) {
      const uploaded = await uploadMediaFile({
        userId: session.sub,
        file: file,
        bucketName: "media",
      });
      images.push(uploaded.file_path);
    }
  }

  try {
    await createWork({
      title,
      author,
      content,
      category,
      coverImageUrl,
      images,
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

  const imagesFiles = formData.getAll("images");
  let images: string[] | undefined = undefined;
  
  if (imagesFiles.length > 0) {
    images = [];
    for (const file of imagesFiles) {
      if (file instanceof File && file.size > 0) {
        const uploaded = await uploadMediaFile({
          userId: session.sub,
          file: file,
          bucketName: "media",
        });
        images.push(uploaded.file_path);
      }
    }
    // Only update images if the user tried to upload actual images
    // Wait, the input might be empty because user didn't select new images, 
    // so if they didn't, we just skip updating this field.
    if (images.length === 0) {
        images = undefined;
    }
  }

  const removedImagesStr = formData.get("removedImages")?.toString();
  let finalImagesToKeep: string[] | undefined = undefined;
  
  if (removedImagesStr) {
    try {
      const removedImages = JSON.parse(removedImagesStr) as string[];
      if (removedImages.length > 0) {
        // If we want to remove existing images without uploading new ones, we must fetch existing images.
        // Wait, instead of fetching, let's just accept 'existingImages' array from the client 
        // that handles the actual state of images.
        const existingImagesStr = formData.get("existingImages")?.toString();
        if (existingImagesStr) {
           const existingImages = JSON.parse(existingImagesStr) as string[];
           images = [...existingImages, ...(images || [])];
        }
      }
    } catch(e) {}
  } else {
      const existingImagesStr = formData.get("existingImages")?.toString();
      if (existingImagesStr) {
         try {
             // We get the remaining existing images
             const existingImages = JSON.parse(existingImagesStr) as string[];
             // Only if the client sends this field, we modify the array.
             images = [...existingImages, ...(images || [])];
         } catch(e) {}
      }
  }

  try {
    await updateWork(id, {
      ...(title && { title }),
      ...(author && { author }),
      ...(content && { content }),
      ...(category && { category }),
      ...(coverImageUrl && { coverImageUrl }),
      ...(images !== undefined && { images }),
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
