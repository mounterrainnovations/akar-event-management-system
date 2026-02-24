import { getBackendUrl } from "@/lib/backend";

export type WorkCategory = "upcoming" | "past" | "article";

export type WorkItem = {
  id: string;
  title: string;
  author: string;
  content: string;
  category: WorkCategory;
  coverImageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function fetchWorks(category?: WorkCategory): Promise<WorkItem[]> {
  const url = new URL("/api/works", getBackendUrl());
  if (category) {
    url.searchParams.set("category", category);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch works");
  }
  return res.json();
}

export async function fetchWorkById(id: string): Promise<WorkItem> {
  const url = `${getBackendUrl()}/api/works/${id}`;
  const res = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch work details");
  }
  return res.json();
}
