import { getBackendUrl } from "@/lib/backend";

export type WebsiteSection = "highlights" | "hero-carousel" | "members";

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

type WebsiteMediaResponse = {
  items?: WebsiteMediaItem[];
};

export async function fetchSectionMedia(
  section: WebsiteSection,
  options?: {
    active?: boolean;
    limit?: number;
  },
) {
  try {
    const baseUrl = getBackendUrl();
    const params = new URLSearchParams();
    params.set("active", options?.active === false ? "false" : "true");
    if (options?.limit) {
      params.set("limit", String(options.limit));
    }

    const response = await fetch(
      `${baseUrl}/api/website-media/${section}?${params.toString()}`,
    );
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.warn("website-media request failed", {
        section,
        status: response.status,
        body,
      });
      return [];
    }

    const data = (await response.json()) as WebsiteMediaResponse;
    return Array.isArray(data.items) ? data.items : [];
  } catch (error) {
    console.warn("website-media request errored", {
      section,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return [];
  }
}
