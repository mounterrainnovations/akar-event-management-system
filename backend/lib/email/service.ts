import { getLogger } from "@/lib/logger";

const logger = getLogger("email-service");

const ZEPTOMAIL_URL = process.env.ZEPTOMAIL_URL || "api.zeptomail.in";
const ZEPTOMAIL_TOKEN = process.env.ZEPTOMAIL_TOKEN;
const ZEPTOMAIL_AGENT_ALIAS = process.env.ZEPTOMAIL_AGENT_ALIAS;

if (!ZEPTOMAIL_TOKEN) {
  logger.warn("ZEPTOMAIL_TOKEN is not set in environment variables");
}

interface SendEmailParams {
  to: { email: string; name: string }[];
  templateKey: string;
  mergeInfo?: Record<string, unknown>;
}

export async function sendEmailWithTemplate({
  to,
  templateKey,
  mergeInfo = {},
}: SendEmailParams) {
  if (!ZEPTOMAIL_TOKEN) {
    logger.error("Cannot send email: ZeptoMail token missing");
    return { ok: false, error: "Configuration missing" };
  }

  const url = `https://${ZEPTOMAIL_URL}/v1.1/email/template`;

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
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `${ZEPTOMAIL_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("ZeptoMail API error", {
        status: response.status,
        data,
      });
      return { ok: false, error: data.message || "Email sending failed" };
    }

    return { ok: true, data };
  } catch (error) {
    logger.error("Failed to send email", {
      error: error instanceof Error ? error.message : "Unknown error",
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
      event_name: eventName, // Assuming the template uses this variable? I'll use common ones just in case.
      name: name,
    },
  });
}
