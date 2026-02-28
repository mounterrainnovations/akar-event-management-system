import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProxiedImageUrl(originalUrl: string | null | undefined) {
  if (!originalUrl) return "";

  // If it's a blocked supabase.co URL, replace it with our safe proxy route
  if (originalUrl.includes("hflfauratacalmqlwdjd.supabase.co")) {
    return originalUrl.replace(
      "https://hflfauratacalmqlwdjd.supabase.co",
      "/supabase-api", // Uses the rewrite we put in next.config.ts
    );
  }

  return originalUrl;
}
