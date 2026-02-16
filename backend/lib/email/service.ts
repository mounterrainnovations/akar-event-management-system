import { getLogger } from "@/lib/logger";

const logger = getLogger("email-service");

// Token check moved inside function to ensure runtime environment is loaded

interface SendEmailParams {
  to: { email: string; name: string }[];
  templateKey: string;
  mergeInfo?: Record<string, unknown>;
  attachments?: {
    name: string;
    content: string; // Base64 encoded content
    mime_type: string;
  }[];
}

export async function sendEmailWithTemplate({
  to,
  templateKey,
  mergeInfo = {},
  attachments = [],
}: SendEmailParams) {
  // Reload env var to ensure we catch runtime changes if any
  const token = process.env.ZEPTOMAIL_TOKEN;
  const ZEPTOMAIL_URL = process.env.ZEPTOMAIL_URL || "api.zeptomail.in";

  if (!token) {
    logger.error("Cannot send email: ZeptoMail token missing", {
      envKeys: Object.keys(process.env).filter((k) => k.includes("ZEPTO")),
    });
    return { ok: false, error: "Configuration missing" };
  }

  const url = `https://${ZEPTOMAIL_URL}/v1.1/email/template`;

  logger.info("Attempting to send email via ZeptoMail", {
    url,
    recipientCount: to.length,
    templateKey,
  });

  try {
    const payload = {
      template_key: templateKey,
      from: {
        address: "noreply@akarwomengroup.com",
        name: "Akar Women Group",
      },
      to: to.map((recipient) => ({
        email_address: {
          address: recipient.email,
          name: recipient.name,
        },
      })),
      merge_info: mergeInfo,
      attachments: attachments,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("ZeptoMail API error", {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      return { ok: false, error: data.message || "Email sending failed" };
    }

    logger.info("ZeptoMail email sent successfully", {
      requestId: data.request_id || "unknown",
      message: data.message,
    });

    return { ok: true, data };
  } catch (error) {
    logger.error("Failed to send email", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { ok: false, error: "Network or internal error" };
  }
}

export async function sendWishlistConfirmation(
  email: string,
  name: string,
  eventName: string,
) {
  const TEMPLATE_KEY =
    "2518b.623682b2828bdc79.k1.3d8782e0-0ab7-11f1-bfdd-8e9a6c33ddc2.19c6341620e";

  return sendEmailWithTemplate({
    to: [{ email, name }],
    templateKey: TEMPLATE_KEY,
    mergeInfo: {
      event_name: eventName,
      name: name,
    },
  });
}

import { generateTicketPDF } from "../pdfs/ticket-generator";

// ... existing imports

export async function sendBookingSuccessEmail(
  email: string,
  name: string,
  eventName: string,
  amount: string,
  bookingId: string,
  // Add optional detailed params
  tickets?: { name: string; quantity: number; price: number; type: string }[],
  bookingDate?: string,
  eventDate?: string,
  location?: string,
  eventTerms?: string,
  preGeneratedPdfBuffer?: Buffer,
) {
  // Configured Template ID from requirements
  const TEMPLATE_KEY =
    "2518b.623682b2828bdc79.k1.22cf3a90-0b0e-11f1-84b6-cabf48e1bf81.19c657adcb9";

  let attachments: { name: string; content: string; mime_type: string }[] = [];

  try {
    const pdfBuffer =
      preGeneratedPdfBuffer ||
      (await generateTicketPDF({
        eventName,
        userName: name,
        bookingId,
        amount,
        location: location || "Check event page",
        eventDate: eventDate || "TBA",
        bookingDate: bookingDate,
        tickets: tickets,
        eventTerms: eventTerms,
      }));

    attachments.push({
      name: `Ticket-${bookingId}.pdf`,
      content: pdfBuffer.toString("base64"),
      mime_type: "application/pdf",
    });

    logger.info("Sent PDF ticket attachment", {
      bookingId,
      size: pdfBuffer.length,
      isPreGenerated: !!preGeneratedPdfBuffer,
    });
  } catch (pdfError) {
    logger.error("Failed to generate PDF ticket for email", {
      bookingId,
      error: pdfError,
    });
    // We continue to send the email even if PDF fails, but log the error.
  }

  return sendEmailWithTemplate({
    to: [{ email, name }],
    templateKey: TEMPLATE_KEY,
    mergeInfo: {
      event_name: eventName,
      name: name,
      amount: amount,
      booking_id: bookingId,
      status: "Successful",
    },
    attachments,
  });
}

export async function sendBookingFailureEmail(
  email: string,
  name: string,
  eventName: string,
  amount: string,
  bookingId: string,
) {
  // Using the same template ID as requested for failure
  const TEMPLATE_KEY =
    "2518b.623682b2828bdc79.k1.22cf3a90-0b0e-11f1-84b6-cabf48e1bf81.19c657adcb9";

  return sendEmailWithTemplate({
    to: [{ email, name }],
    templateKey: TEMPLATE_KEY,
    mergeInfo: {
      event_name: eventName,
      name: name,
      amount: amount,
      booking_id: bookingId,
      status: "Failed",
    },
  });
}
