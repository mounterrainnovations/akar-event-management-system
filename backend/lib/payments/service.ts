import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLogger } from "@/lib/logger";
import { getEventRegistrationTransactionLookup } from "@/lib/queries/event-registrations";
import {
  sendBookingFailureEmail,
  sendBookingSuccessEmail,
} from "@/lib/email/service";
import { generateTicketPDF } from "@/lib/pdfs/ticket-generator";
import { getEventRegistrationTransactionLookup } from "@/lib/queries/event-registrations";
import { BOOKING_SELECT_FIELDS } from "@/lib/bookings/queries";
import {
  buildEasebuzzInitiatePayload,
  initiateEasebuzzTransaction,
} from "@/lib/payments/easebuzz/service";
import {
  getEasebuzzBaseUrl,
  getEasebuzzPaymentPath,
} from "@/lib/payments/easebuzz/config";

const logger = getLogger("payments-service");
const shouldLogFullPaymentPayload =
  process.env.PAYMENT_FLOW_LOG_FULL_PAYLOAD === "true";

const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE || "payments";
const PAYMENT_LOGS_TABLE = process.env.PAYMENT_LOGS_TABLE || "payment_logs";
const EVENT_REGISTRATIONS_TABLE =
  process.env.EVENT_REGISTRATIONS_TABLE || "event_registrations";

type CreatePendingPaymentInput = {
  transactionId: string;
  registrationId: string;
  userId: string;
  amount: number;
  easebuzzTxnId: string;
};

type LogInitiatePaymentInput = {
  transactionId: string;
  easebuzzUrl: string;
  requestPayload: Record<string, string>;
  responsePayload: unknown;
  httpStatus: number;
  easebuzzStatus?: string | number | null;
  errorMessage?: string | null;
};

type LogCallbackPaymentInput = {
  action?: "callback" | "transaction";
  transactionId?: string | null;
  easebuzzTxnId?: string | null;
  easebuzzUrl: string;
  requestPayload: Record<string, string> | null;
  responsePayload: unknown;
  httpStatus: number;
  easebuzzStatus?: string | number | null;
  errorMessage?: string | null;
};

type CallbackBusinessUpdateInput = {
  transactionId?: string | null;
  easebuzzTxnId?: string | null;
  registrationId?: string | null;
  flow: "success" | "failure" | "pending";
  callbackStatus: string;
  gatewayMessage?: string | null;
  paymentMode?: string | null;
};

type RegistrationTransactionLookup = {
  registrationId: string;
  transactionId: string;
};

type EasebuzzInitiateGatewayPayload = {
  status?: number | string | null;
  data?: string | null;
  msg?: string | null;
  message?: string | null;
  error?: string | null;
  error_desc?: string | null;
};

export type InitiatePaymentFlowInput = {
  amount: number;
  productInfo: string;
  firstName: string;
  email: string;
  phone: string;
  userId: string;
  eventId?: string;
  registrationId: string;
};

export type InitiatePaymentFlowResult =
  | {
      ok: true;
      status: 200;
      transactionId: string;
      paymentUrl: string;
      gateway: unknown;
    }
  | {
      ok: false;
      status: 500 | 502;
      transactionId: string | null;
      error: string;
      gateway: unknown;
    };

function normalizeAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  return amount.toFixed(2);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function parseEasebuzzGatewayPayload(
  payload: unknown,
): EasebuzzInitiateGatewayPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload as EasebuzzInitiateGatewayPayload;
}

function normalizeGatewayStatus(status: unknown): number | null {
  if (typeof status === "number" && Number.isFinite(status)) {
    return status;
  }
  if (typeof status !== "string") {
    return null;
  }

  const numericStatus = Number(status.trim());
  return Number.isFinite(numericStatus) ? numericStatus : null;
}

function resolveGatewayErrorMessage(
  payload: EasebuzzInitiateGatewayPayload | null,
): string {
  const value =
    payload?.error_desc ||
    payload?.error ||
    payload?.msg ||
    payload?.message ||
    payload?.data;
  if (typeof value !== "string" || !value.trim()) {
    return "Easebuzz initiate transaction failed";
  }
  return value.trim();
}

function truncate(value: string, max = 160) {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}...`;
}

function summarizeGatewayPayload(payload: EasebuzzInitiateGatewayPayload | null) {
  if (!payload) {
    return null;
  }

  return {
    status: payload.status ?? null,
    data:
      typeof payload.data === "string" ? truncate(payload.data) : payload.data,
    msg: typeof payload.msg === "string" ? truncate(payload.msg) : payload.msg,
    message:
      typeof payload.message === "string"
        ? truncate(payload.message)
        : payload.message,
    error:
      typeof payload.error === "string" ? truncate(payload.error) : payload.error,
    error_desc:
      typeof payload.error_desc === "string"
        ? truncate(payload.error_desc)
        : payload.error_desc,
  };
}

function classifyInitiateFailure(input: {
  httpStatus: number;
  gatewayStatus: number | null;
  message: string;
  payload: EasebuzzInitiateGatewayPayload | null;
}) {
  const message = input.message.toLowerCase();
  const status = input.gatewayStatus;
  const codeMatch =
    input.message.match(/error\s*code\s*:\s*([a-z0-9_-]+)/i)?.[1] || null;

  let category = "unknown";
  if (input.httpStatus >= 500) {
    category = "gateway_http_5xx";
  } else if (input.httpStatus >= 400) {
    category = "gateway_http_4xx";
  } else if (status === 0) {
    category = "gateway_business_reject";
  }

  if (message.includes("hash")) {
    category = "possible_hash_or_credentials_issue";
  } else if (message.includes("invalid key") || message.includes("key")) {
    category = "possible_merchant_key_issue";
  } else if (message.includes("amount")) {
    category = "possible_amount_validation_issue";
  } else if (message.includes("txnid")) {
    category = "possible_txnid_validation_issue";
  }

  return {
    category,
    code: codeMatch,
    httpStatus: input.httpStatus,
    gatewayStatus: status,
    gatewayPayload: summarizeGatewayPayload(input.payload),
  };
}

export async function getRegistrationTransactionLookup(
  registrationId: string,
): Promise<RegistrationTransactionLookup> {
  if (!isUuid(registrationId)) {
    throw new Error("registrationId must be a valid UUID");
  }

  const lookup = await getEventRegistrationTransactionLookup(registrationId);
  const transactionId = lookup.transactionId;
  if (!transactionId) {
    throw new Error("No transaction_id mapped for this registration");
  }

  return {
    registrationId: lookup.registrationId,
    transactionId,
  };
}

async function fetchPaymentIdByColumn(
  column: "id" | "easebuzz_txnid",
  value: string,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select("id")
    .eq(column, value)
    .maybeSingle<{ id: string }>();

  if (error || !data?.id) {
    return null;
  }

  return data.id;
}

export async function initiatePaymentFlow(params: {
  input: InitiatePaymentFlowInput;
  requestOrigin: string;
}): Promise<InitiatePaymentFlowResult> {
  let transactionId: string | null = null;

  try {
    const { payload, transactionId: generatedTransactionId } =
      buildEasebuzzInitiatePayload({
        input: params.input,
        requestOrigin: params.requestOrigin,
      });

    transactionId = generatedTransactionId;
    logger.info("Payment flow step: initiate payload built", {
      transactionId,
      registrationId: params.input.registrationId,
      amount: params.input.amount,
      input: {
        productInfo: params.input.productInfo,
        firstName: params.input.firstName,
        email: params.input.email,
        phone: params.input.phone,
        userId: params.input.userId,
        eventId: params.input.eventId || null,
      },
      ...(shouldLogFullPaymentPayload
        ? {
            fullGatewayPayload: payload,
          }
        : {}),
    });

    await createPendingPayment({
      transactionId,
      registrationId: params.input.registrationId,
      userId: params.input.userId,
      amount: params.input.amount,
      easebuzzTxnId: transactionId,
    });
    logger.info("Payment flow step: pending payment row created", {
      transactionId,
      registrationId: params.input.registrationId,
    });

    const gatewayResponse = await initiateEasebuzzTransaction(payload);
    const gatewayPayload = parseEasebuzzGatewayPayload(gatewayResponse.data);
    const gatewayStatus = normalizeGatewayStatus(gatewayPayload?.status ?? null);
    logger.info("Payment flow step: Easebuzz initiate response received", {
      transactionId,
      httpStatus: gatewayResponse.status,
      gatewayStatus,
      gatewayPayload: summarizeGatewayPayload(gatewayPayload),
    });

    await logInitiatePaymentRequest({
      transactionId,
      easebuzzUrl: gatewayResponse.endpoint,
      requestPayload: payload,
      responsePayload: gatewayResponse.data,
      httpStatus: gatewayResponse.status,
      easebuzzStatus: gatewayStatus,
      errorMessage: gatewayResponse.ok
        ? null
        : "Easebuzz initiate transaction failed",
    });

    if (!gatewayResponse.ok || gatewayStatus !== 1) {
      const errorMessage = resolveGatewayErrorMessage(gatewayPayload);
      const failureMeta = classifyInitiateFailure({
        httpStatus: gatewayResponse.status,
        gatewayStatus,
        message: errorMessage,
        payload: gatewayPayload,
      });
      await markPaymentInitiateFailed({
        transactionId,
        message: errorMessage,
      });

      logger.error("Easebuzz initiate call failed", {
        status: gatewayResponse.status,
        gatewayStatus,
        gatewayMessage: errorMessage,
        diagnostics: failureMeta,
        transactionId,
      });

      return {
        ok: false,
        status: 502,
        transactionId,
        error: errorMessage,
        gateway: gatewayResponse.data,
      };
    }

    const paymentToken = gatewayPayload?.data?.trim() || "";
    if (!paymentToken) {
      const errorMessage = "Easebuzz initiate succeeded without payment token";
      await markPaymentInitiateFailed({
        transactionId,
        message: errorMessage,
      });

      logger.error("Easebuzz initiate missing payment token", {
        transactionId,
      });

      return {
        ok: false,
        status: 502,
        transactionId,
        error: errorMessage,
        gateway: gatewayResponse.data,
      };
    }

    const gatewayUrl = `${getEasebuzzBaseUrl()}${getEasebuzzPaymentPath()}`;
    const paymentUrl = `${gatewayUrl}/${paymentToken}`;
    logger.info("Payment flow step: payment URL generated", {
      transactionId,
      paymentUrlHost: getEasebuzzBaseUrl(),
      paymentTokenLength: paymentToken.length,
    });

    return {
      ok: true,
      status: 200,
      transactionId,
      paymentUrl,
      gateway: gatewayResponse.data,
    };
  } catch (error) {
    logger.error("Failed to initiate Easebuzz transaction", {
      message: error instanceof Error ? error.message : "Unknown error",
      transactionId,
    });

    if (transactionId && error instanceof Error) {
      try {
        await markPaymentInitiateFailed({
          transactionId,
          message: error.message,
        });
      } catch (updateError) {
        logger.error("Failed to mark payment as failed after initiate error", {
          transactionId,
          message:
            updateError instanceof Error
              ? updateError.message
              : "Unknown error",
        });
      }
    }

    return {
      ok: false,
      status: 500,
      transactionId,
      error:
        error instanceof Error
          ? error.message
          : "Unable to initiate transaction",
      gateway: null,
    };
  }
}

async function fetchPaymentId(input: {
  transactionId?: string | null;
  easebuzzTxnId?: string | null;
}) {
  const transactionId = input.transactionId?.trim();
  if (transactionId) {
    const byId = await fetchPaymentIdByColumn("id", transactionId);
    if (byId) {
      return byId;
    }
  }

  const easebuzzTxnId = input.easebuzzTxnId?.trim() || transactionId;
  if (!easebuzzTxnId) {
    return null;
  }

  const byEasebuzzTxnId = await fetchPaymentIdByColumn(
    "easebuzz_txnid",
    easebuzzTxnId,
  );
  if (byEasebuzzTxnId) {
    return byEasebuzzTxnId;
  }

  return null;
}

function mapFlowToPaymentStatus(flow: "success" | "failure" | "pending") {
  if (flow === "success") {
    return "paid";
  }
  if (flow === "failure") {
    return "failed";
  }
  return "pending";
}

function mapCallbackModeToPaymentMode(mode?: string | null) {
  const normalized = (mode || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized === "upi") {
    return "upi";
  }
  if (
    normalized === "nb" ||
    normalized === "netbanking" ||
    normalized === "net_banking" ||
    normalized === "net banking"
  ) {
    return "net_banking";
  }
  if (
    normalized === "dc" ||
    normalized === "debitcard" ||
    normalized === "debit_card" ||
    normalized === "debit card"
  ) {
    return "debit_card";
  }
  if (
    normalized === "cc" ||
    normalized === "creditcard" ||
    normalized === "credit_card" ||
    normalized === "credit card"
  ) {
    return "credit_card";
  }
  return null;
}

export async function createPendingPayment(input: CreatePendingPaymentInput) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .insert({
      id: input.transactionId,
      registration_id: input.registrationId,
      user_id: input.userId,
      easebuzz_txnid: input.easebuzzTxnId,
      amount: normalizeAmount(input.amount),
      status: "pending",
      initiated_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data?.id) {
    throw new Error(
      `Unable to create pending payment row: ${error?.message || "Unknown error"}`,
    );
  }

  logger.info("Created pending payment row", {
    paymentId: data.id,
    registrationId: input.registrationId,
    userId: input.userId,
    easebuzzTxnId: input.easebuzzTxnId,
  });

  const { error: registrationLinkError } = await supabase
    .from(EVENT_REGISTRATIONS_TABLE)
    .update({
      transaction_id: input.easebuzzTxnId,
    })
    .eq("id", input.registrationId);

  if (registrationLinkError) {
    throw new Error(
      `Unable to link registration with transaction id during initiate: ${registrationLinkError.message}`,
    );
  }

  return data.id;
}

export async function logInitiatePaymentRequest(
  input: LogInitiatePaymentInput,
) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from(PAYMENT_LOGS_TABLE).insert({
    payment_id: input.transactionId,
    action: "initiate",
    easebuzz_url: input.easebuzzUrl,
    request_payload: input.requestPayload,
    response_payload: input.responsePayload,
    http_status: input.httpStatus,
    easebuzz_status: input.easebuzzStatus || null,
    error_message: input.errorMessage || null,
  });

  if (error) {
    throw new Error(`Unable to create payment log row: ${error.message}`);
  }
}

export async function markPaymentInitiateFailed(input: {
  transactionId: string;
  message: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from(PAYMENTS_TABLE)
    .update({
      status: "failed",
      gateway_response_message: input.message,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.transactionId);

  if (error) {
    throw new Error(
      `Unable to mark payment initiate as failed: ${error.message}`,
    );
  }
}

export async function logCallbackPaymentRequest(
  input: LogCallbackPaymentInput,
) {
  const supabase = createSupabaseAdminClient();
  const paymentId = await fetchPaymentId({
    transactionId: input.transactionId,
    easebuzzTxnId: input.easebuzzTxnId,
  });

  const { error } = await supabase.from(PAYMENT_LOGS_TABLE).insert({
    payment_id: paymentId,
    action: input.action || "callback",
    easebuzz_url: input.easebuzzUrl,
    request_payload: input.requestPayload,
    response_payload: input.responsePayload || null,
    http_status: input.httpStatus,
    easebuzz_status: input.easebuzzStatus || null,
    error_message: input.errorMessage || null,
  });

  if (error) {
    throw new Error(
      `Unable to create callback payment log row: ${error.message}`,
    );
  }
}

export async function applyCallbackBusinessStatus(
  input: CallbackBusinessUpdateInput,
) {
  const supabase = createSupabaseAdminClient();
  const paymentStatus = mapFlowToPaymentStatus(input.flow);

  // ... (fetchPaymentId and payment update logic)
  const paymentId = await fetchPaymentId({
    transactionId: input.transactionId,
    easebuzzTxnId: input.easebuzzTxnId,
  });

  const paymentUpdatePayload: {
    status: "paid" | "failed" | "pending";
    gateway_response_message: string | null;
    mode?: "upi" | "net_banking" | "debit_card" | "credit_card";
    completed_at: string | null;
    updated_at: string;
  } = {
    status: paymentStatus,
    gateway_response_message:
      input.gatewayMessage ||
      `Easebuzz callback status: ${input.callbackStatus}`,
    completed_at: paymentStatus === "paid" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const normalizedMode = mapCallbackModeToPaymentMode(input.paymentMode);
  if (normalizedMode) {
    paymentUpdatePayload.mode = normalizedMode;
  }

  if (paymentId) {
    const { error } = await supabase
      .from(PAYMENTS_TABLE)
      .update(paymentUpdatePayload)
      .eq("id", paymentId);

    if (error) {
      throw new Error(
        `Unable to update payment status from callback: ${error.message}`,
      );
    }
  } else {
    logger.warn("Callback payment row not found for status update", {
      transactionId: input.transactionId || null,
      easebuzzTxnId: input.easebuzzTxnId || null,
      flow: input.flow,
    });
  }

  const registrationId = input.registrationId?.trim();
  if (!registrationId) {
    logger.warn(
      "Callback registrationId missing; skipped registration update",
      {
        transactionId: input.transactionId || null,
        flow: input.flow,
      },
    );
    return;
  }
  if (!isUuid(registrationId)) {
    logger.warn(
      "Callback registrationId is not a valid UUID; skipped registration update",
      {
        registrationId,
        transactionId: input.transactionId || null,
        flow: input.flow,
      },
    );
    return;
  }

  const registrationUpdatePayload: {
    payment_status: "paid" | "failed" | "pending";
    transaction_id?: string;
  } = {
    payment_status: paymentStatus,
  };
  const transactionIdForRegistration =
    input.easebuzzTxnId?.trim() || input.transactionId?.trim();
  if (transactionIdForRegistration) {
    registrationUpdatePayload.transaction_id = transactionIdForRegistration;
  }

  /* 
     Update to use full BOOKING_SELECT_FIELDS so we get ticket definitions + tickets_bought 
     This allows us to generate the detailed invoice PDF.
  */
  const registrationUpdateQuery = supabase
    .from(EVENT_REGISTRATIONS_TABLE)
    .update(registrationUpdatePayload)
    .eq("id", registrationId)
    .select(BOOKING_SELECT_FIELDS) // Use the full selection string
    .single();

  const { data: registrationData, error } = await registrationUpdateQuery;

  if (error) {
    throw new Error(
      `Unable to update event registration payment status from callback: ${error.message}`,
    );
  }

  // Trigger Email Notification
  if (
    (input.flow === "success" || input.flow === "failure") &&
    registrationData
  ) {
    try {
      // Safely access nested properties using unknown casting then to expected shape
      // The shape matches BookingRow mostly
      const row = registrationData as any; // Escape hatch for complex join types

      const eventData = row.events || {};
      const formResponse = row.form_response || {};

      const email =
        typeof formResponse?.email === "string"
          ? formResponse.email
          : (formResponse?.Email as string);

      // Try various common name fields
      const name =
        typeof formResponse?.full_name === "string"
          ? formResponse.full_name
          : typeof formResponse?.name === "string"
            ? formResponse.name
            : typeof formResponse?.Name === "string"
              ? formResponse.Name
              : "Valued Customer";

      const eventName = eventData?.name || "Event";
      const amount = String(row.final_amount || 0);

      // Extract detailed ticket info for PDF
      const ticketsBought = row.tickets_bought || {};
      const eventTicketsDefs = eventData.event_tickets || [];

      const ticketsBreakdown = Object.entries(ticketsBought).map(
        ([ticketId, qty]) => {
          const def = eventTicketsDefs.find((t: any) => t.id === ticketId);
          // description is JSONB, usually has name/type
          const desc = def?.description || {};
          return {
            name: desc.name || "Ticket",
            type: desc.type || "Standard",
            quantity: Number(qty),
            price: Number(def?.price || 0),
          };
        },
      );

      // Construct Event Date / Location strings
      const eventDateStr = eventData.event_date
        ? new Date(eventData.event_date).toLocaleString()
        : undefined;
      const locationStr = [
        eventData.address_line_1,
        eventData.city,
        eventData.state,
      ]
        .filter(Boolean)
        .join(", ");

      if (email) {
        if (input.flow === "success") {
          let pdfBuffer: Buffer | undefined;

          try {
            // 1. Generate PDF
            pdfBuffer = await generateTicketPDF({
              eventName,
              userName: name,
              bookingId: row.id,
              amount,
              location: locationStr || "Check event page",
              eventDate: eventDateStr || "TBA",
              bookingDate: new Date().toISOString(),
              tickets: ticketsBreakdown,
              eventTerms: eventData.terms_and_conditions,
            });

            // 2. Upload to Supabase Storage
            const fileName = `${row.id}.pdf`;
            const { error: uploadError } = await supabase.storage
              .from("tickets")
              .upload(fileName, pdfBuffer, {
                contentType: "application/pdf",
                upsert: true,
              });

            if (uploadError) {
              logger.error("Failed to upload ticket to Supabase Storage", {
                registrationId,
                error: uploadError,
              });
            } else {
              // 3. Update registration with ticket_url
              const { data: publicUrlData } = supabase.storage
                .from("tickets")
                .getPublicUrl(fileName);

              await supabase
                .from(EVENT_REGISTRATIONS_TABLE)
                .update({ ticket_url: publicUrlData.publicUrl })
                .eq("id", row.id);

              logger.info("Uploaded ticket and updated registration row", {
                registrationId,
                url: publicUrlData.publicUrl,
              });
            }
          } catch (pdfGenError) {
            logger.error("PDF generation or storage upload failed", {
              registrationId,
              error: pdfGenError,
            });
          }

          // 4. Send Email (passing the buffer if available, otherwise it falls back to generation)
          await sendBookingSuccessEmail(
            email,
            name,
            eventName,
            amount,
            row.id,
            ticketsBreakdown,
            new Date().toISOString(),
            eventDateStr,
            locationStr,
            eventData.terms_and_conditions,
            pdfBuffer,
          );
          logger.info("Sent booking success email", { registrationId, email });
        } else {
          await sendBookingFailureEmail(email, name, eventName, amount, row.id);
          logger.info("Sent booking failure email", { registrationId, email });
        }
      } else {
        logger.warn(
          "Could not send email: email field missing in form_response",
          { registrationId },
        );
      }
    } catch (emailError) {
      logger.error("Failed to send booking email", {
        registrationId,
        error:
          emailError instanceof Error ? emailError.message : "Unknown error",
        flow: input.flow,
      });
      // We do not throw here to avoid failing the webhook response if email fails
    }
  }
}
