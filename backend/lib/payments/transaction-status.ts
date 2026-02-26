import {
  extractEasebuzzCallbackData,
  resolveEasebuzzCallbackFlow,
  retrieveEasebuzzTransaction,
  verifyEasebuzzCallbackHash,
} from "@/lib/payments/easebuzz/service";
import {
  applyCallbackBusinessStatus,
  getRegistrationTransactionLookup,
  logCallbackPaymentRequest,
} from "@/lib/payments/service";

export type RegistrationTransactionSyncResult = {
  ok: boolean;
  registrationId: string;
  transactionId: string | null;
  status: string | null;
  flow: "success" | "failure" | "pending" | "unknown";
  hashVerification: ReturnType<typeof verifyEasebuzzCallbackHash> | null;
  gateway?: unknown;
  error?: string;
};

async function syncSingleRegistrationTransaction(
  registrationId: string,
): Promise<RegistrationTransactionSyncResult> {
  try {
    const lookup = await getRegistrationTransactionLookup(registrationId);
    const retrieveResult = await retrieveEasebuzzTransaction({
      txnid: lookup.transactionId,
    });

    const callbackData = extractEasebuzzCallbackData(retrieveResult.payload);
    const hashVerification = verifyEasebuzzCallbackHash(callbackData);
    const flow = resolveEasebuzzCallbackFlow(callbackData.status);

    await logCallbackPaymentRequest({
      action: "transaction",
      transactionId: lookup.transactionId,
      easebuzzTxnId: lookup.transactionId,
      easebuzzUrl: retrieveResult.endpoint,
      requestPayload: retrieveResult.requestPayload,
      responsePayload: {
        callback: callbackData,
        hashVerification,
      },
      httpStatus: retrieveResult.status,
      easebuzzStatus: callbackData.status,
      errorMessage: retrieveResult.ok ? null : "Easebuzz retrieve API failed",
    });

    if (hashVerification.valid && flow !== "unknown") {
      await applyCallbackBusinessStatus({
        transactionId: lookup.transactionId,
        easebuzzTxnId: lookup.transactionId,
        registrationId: lookup.registrationId,
        flow,
        callbackStatus: callbackData.status,
        gatewayMessage: callbackData.errorMessage || callbackData.error || null,
        paymentMode: callbackData.mode || null,
        skipFailureEmail: true,
      });
    }

    return {
      ok: true,
      registrationId: lookup.registrationId,
      transactionId: lookup.transactionId,
      status: callbackData.status || null,
      flow,
      hashVerification,
      gateway: retrieveResult.payload,
    };
  } catch (error) {
    return {
      ok: false,
      registrationId,
      transactionId: null,
      status: null,
      flow: "unknown",
      hashVerification: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to sync transaction status",
    };
  }
}

export async function syncRegistrationTransactions(
  registrationIds: string[],
): Promise<RegistrationTransactionSyncResult[]> {
  const uniqueIds = Array.from(
    new Set(
      registrationIds
        .map((registrationId) => registrationId.trim())
        .filter(Boolean),
    ),
  );

  return Promise.all(
    uniqueIds.map((registrationId) =>
      syncSingleRegistrationTransaction(registrationId),
    ),
  );
}
