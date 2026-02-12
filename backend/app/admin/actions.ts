"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getLogger } from "@/lib/logger";
import {
  deleteSectionMediaItem,
  toggleSectionMediaVisibility,
  uploadFilesToSection,
} from "@/lib/media/website-media-service";
import { type WebsiteSection } from "@/lib/media/website-sections";

const logger = getLogger("admin-actions");

function parseSection(value: FormDataEntryValue | null): WebsiteSection | null {
  if (value === "highlights") {
    return value;
  }
  return null;
}

export async function uploadSectionMediaAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login?error=Please+sign+in+again");
  }

  const section = parseSection(formData.get("section"));
  if (!section) {
    redirect("/admin?error=Invalid+section");
  }
  const files = formData.getAll("mediaFiles").filter((entry): entry is File => entry instanceof File);

  try {
    await uploadFilesToSection({
      userId: session.sub,
      section,
      files,
    });
  } catch (error) {
    logger.error("Section media upload failed", {
      userId: session.sub,
      section,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(`/admin?error=${encodeURIComponent(error instanceof Error ? error.message : "Upload failed")}`);
  }

  redirect("/admin?success=Media+uploaded+successfully");
}

export async function toggleSectionMediaAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login?error=Please+sign+in+again");
  }

  const websiteMediaId = formData.get("websiteMediaId");
  if (typeof websiteMediaId !== "string" || websiteMediaId.length === 0) {
    redirect("/admin?error=Invalid+media+item");
  }

  try {
    await toggleSectionMediaVisibility({
      websiteMediaId,
      userId: session.sub,
    });
  } catch (error) {
    logger.error("Section media toggle failed", {
      userId: session.sub,
      websiteMediaId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(`/admin?error=${encodeURIComponent(error instanceof Error ? error.message : "Update failed")}`);
  }

  redirect("/admin?success=Visibility+updated");
}

export async function deleteSectionMediaAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login?error=Please+sign+in+again");
  }

  const websiteMediaId = formData.get("websiteMediaId");
  if (typeof websiteMediaId !== "string" || websiteMediaId.length === 0) {
    redirect("/admin?error=Invalid+media+item");
  }

  try {
    await deleteSectionMediaItem({
      websiteMediaId,
      userId: session.sub,
    });
  } catch (error) {
    logger.error("Section media delete failed", {
      userId: session.sub,
      websiteMediaId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(`/admin?error=${encodeURIComponent(error instanceof Error ? error.message : "Delete failed")}`);
  }

  redirect("/admin?success=Media+removed");
}
