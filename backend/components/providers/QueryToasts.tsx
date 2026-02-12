"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

type QueryToastsProps = {
  keys?: Array<"success" | "error" | "info">;
  scope: string;
};

function notify(type: "success" | "error" | "info", message: string, toastId: string) {
  if (type === "success") {
    toast.success(message, { toastId });
    return;
  }
  if (type === "error") {
    toast.error(message, { toastId });
    return;
  }
  toast.info(message, { toastId });
}

export function QueryToasts({ keys = ["success", "error", "info"], scope }: QueryToastsProps) {
  const searchParams = useSearchParams();
  const serializedParams = searchParams.toString();
  const activeKeys = useMemo(() => keys, [keys]);

  useEffect(() => {
    activeKeys.forEach((key) => {
      const message = searchParams.get(key);
      if (!message) {
        return;
      }
      notify(key, message, `${scope}:${key}:${message}`);
    });
  }, [activeKeys, scope, searchParams, serializedParams]);

  return null;
}
