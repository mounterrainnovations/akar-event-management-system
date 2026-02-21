const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
  const url = new URL("/api/works", BACKEND_URL);
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
  const url = `${BACKEND_URL}/api/works/${id}`;
  const res = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch work details");
  }
  return res.json();
}
