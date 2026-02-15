import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import {
  hasValidCronBearerToken,
  isCronSecretConfigured,
} from "@/lib/payments/auth";
import { listPendingPaymentRegistrationIdsPage } from "@/lib/queries/payments";

const logger = getLogger("api-payments-cron-sync-pending");

const DEFAULT_SYNC_BATCH_SIZE = 25;
const MAX_SYNC_BATCH_SIZE = 100;
const DEFAULT_SCAN_PAGE_SIZE = 200;
const MAX_SCAN_PAGE_SIZE = 500;

type TransactionBatchResponse = {
  ok?: boolean;
  total?: number;
  successful?: number;
  failed?: number;
  items?: Array<{
    ok?: boolean;
    registrationId?: string;
    error?: string;
  }>;
  error?: string;
};

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  max: number,
  fieldName: string,
) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  return Math.min(parsed, max);
}

function chunkArray<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function collectPendingRegistrationIds(pageSize: number) {
  const registrationIds: string[] = [];
  let page = 1;

  while (true) {
    const currentPageRows = await listPendingPaymentRegistrationIdsPage({
      page,
      limit: pageSize,
    });

    if (!currentPageRows.length) {
      break;
    }

    registrationIds.push(...currentPageRows);

    if (currentPageRows.length < pageSize) {
      break;
    }

    page += 1;
  }

  return Array.from(new Set(registrationIds));
}

export async function GET(request: NextRequest) {
  try {
    if (!isCronSecretConfigured()) {
      return NextResponse.json(
        {
          error: "CRON_SECRET is not configured",
        },
        {
          status: 500,
        },
      );
    }

    const authorizationHeader = request.headers.get("authorization");
    if (!hasValidCronBearerToken(authorizationHeader)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    let batchSize = DEFAULT_SYNC_BATCH_SIZE;
    let scanPageSize = DEFAULT_SCAN_PAGE_SIZE;
    try {
      batchSize = parsePositiveInteger(
        request.nextUrl.searchParams.get("batchSize"),
        DEFAULT_SYNC_BATCH_SIZE,
        MAX_SYNC_BATCH_SIZE,
        "batchSize",
      );
      scanPageSize = parsePositiveInteger(
        request.nextUrl.searchParams.get("scanPageSize"),
        DEFAULT_SCAN_PAGE_SIZE,
        MAX_SCAN_PAGE_SIZE,
        "scanPageSize",
      );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid cron query parameters",
        },
        {
          status: 400,
        },
      );
    }

    const pendingRegistrationIds = await collectPendingRegistrationIds(
      scanPageSize,
    );

    if (!pendingRegistrationIds.length) {
      return NextResponse.json(
        {
          ok: true,
          message: "No pending payments to sync",
          scannedPendingRegistrations: 0,
          processedBatches: 0,
        },
        {
          status: 200,
        },
      );
    }

    const transactionEndpoint = new URL(
      "/api/payments/easebuzz/transaction",
      request.nextUrl.origin,
    );
    const cronSecret = process.env.CRON_SECRET as string;

    const batches = chunkArray(pendingRegistrationIds, batchSize);
    const batchResults: Array<{
      batchNumber: number;
      batchSize: number;
      ok: boolean;
      total: number;
      successful: number;
      failed: number;
      failedItems: Array<{
        registrationId: string;
        error: string;
      }>;
      error?: string;
    }> = [];

    let totalSynced = 0;
    let totalFailed = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      const batchRegistrationIds = batches[batchIndex];
      const response = await fetch(transactionEndpoint.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({
          registrationIds: batchRegistrationIds,
        }),
      });

      let payload: TransactionBatchResponse | null = null;
      try {
        payload = (await response.json()) as TransactionBatchResponse;
      } catch {
        payload = null;
      }

      const batchOk = response.ok && payload?.ok !== false;
      const successful = payload?.successful || 0;
      const failed = payload?.failed || 0;
      const total = payload?.total || batchRegistrationIds.length;
      const failedItems =
        payload?.items
          ?.filter((item) => item.ok === false)
          .map((item) => ({
            registrationId: item.registrationId || "unknown",
            error: item.error || "Unknown sync error",
          })) || [];

      totalSynced += successful;
      totalFailed += failed;

      batchResults.push({
        batchNumber: batchIndex + 1,
        batchSize: batchRegistrationIds.length,
        ok: batchOk,
        total,
        successful,
        failed,
        failedItems,
        error:
          payload?.error ||
          (!response.ok
            ? `Transaction endpoint failed with status ${response.status}`
            : undefined),
      });

      if (!batchOk) {
        logger.warn("Pending payments batch sync failed", {
          batchNumber: batchIndex + 1,
          batchSize: batchRegistrationIds.length,
          status: response.status,
          error: payload?.error || null,
        });
      }
    }

    return NextResponse.json(
      {
        ok: totalFailed === 0,
        scannedPendingRegistrations: pendingRegistrationIds.length,
        processedBatches: batches.length,
        batchSize,
        totals: {
          successful: totalSynced,
          failed: totalFailed,
        },
        batches: batchResults,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    logger.error("Failed to run pending payments cron sync", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Unable to run pending payment cron sync",
      },
      {
        status: 500,
      },
    );
  }
}
