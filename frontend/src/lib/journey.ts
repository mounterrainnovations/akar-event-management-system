import { getBackendUrl } from "@/lib/backend";

export type JourneyItem = {
  id: string;
  year: number;
  title: string;
  content: string;
  poster: string;
  createdAt: string;
  updatedAt: string | null;
};

export async function fetchJourneyItems(): Promise<JourneyItem[]> {
  const url = `${getBackendUrl()}/api/journey`;
  const res = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch journey items");
  }
  return res.json();
}
