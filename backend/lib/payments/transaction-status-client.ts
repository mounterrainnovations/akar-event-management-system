export type TransactionStatusSyncItem = {
  ok: boolean;
  registrationId: string;
  transactionId: string | null;
  status: string | null;
  flow: "success" | "failure" | "pending" | "unknown";
  error?: string;
};

export type TransactionStatusSyncResponse = {
  ok: boolean;
  total: number;
  successful: number;
  failed: number;
  items: TransactionStatusSyncItem[];
  error?: string;
};

type TransactionStatusSyncRequest = {
  registrationId?: string;
  registrationIds?: string[];
};

function normalizeResponse(
  payload: Partial<TransactionStatusSyncResponse> | null,
): TransactionStatusSyncResponse {
  return {
    ok: Boolean(payload?.ok),
    total: payload?.total || 0,
    successful: payload?.successful || 0,
    failed: payload?.failed || 0,
    items: Array.isArray(payload?.items) ? payload.items : [],
    error: payload?.error,
  };
}

export async function syncTransactionStatus(
  input: TransactionStatusSyncRequest,
): Promise<TransactionStatusSyncResponse> {
  const response = await fetch("/api/payments/easebuzz/transaction", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let payload: Partial<TransactionStatusSyncResponse> | null = null;
  try {
    payload = (await response.json()) as Partial<TransactionStatusSyncResponse>;
  } catch {
    payload = null;
  }

  const parsed = normalizeResponse(payload);
  if (!response.ok) {
    throw new Error(
      parsed.error ||
        `Unable to check transaction status (HTTP ${response.status})`,
    );
  }

  return parsed;
}

export async function syncSingleRegistrationTransactionStatus(
  registrationId: string,
) {
  const result = await syncTransactionStatus({ registrationId });
  return {
    ...result,
    item:
      result.items.find((entry) => entry.registrationId === registrationId) ||
      null,
  };
}
