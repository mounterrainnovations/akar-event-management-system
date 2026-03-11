import { getBackendUrl } from './backend';

export type PastEvent = {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export async function fetchPastEvents(): Promise<PastEvent[]> {
  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}/api/past-events`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch past events');
  }

  return response.json();
}
