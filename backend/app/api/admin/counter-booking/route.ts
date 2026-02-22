import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { createCounterBooking } from "@/lib/counter-booking/service";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;

  const eventId =
    typeof payload.eventId === "string" ? payload.eventId.trim() : "";
  const firstName =
    typeof payload.firstName === "string" ? payload.firstName.trim() : "";
  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const ticketsBought = payload.ticketsBought;
  const formResponse = payload.formResponse;

  const bookingCategory =
    typeof payload.bookingCategory === "string"
      ? payload.bookingCategory
      : "Paid";
  const paymentMode =
    typeof payload.paymentMode === "string" ? payload.paymentMode : "Cash";
  const paymentStatus =
    typeof payload.paymentStatus === "string" ? payload.paymentStatus : "Paid";

  if (!eventId)
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  if (!firstName)
    return NextResponse.json(
      { error: "firstName is required" },
      { status: 400 },
    );
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 },
    );
  }
  if (!phone || !/^\d{10}$/.test(phone)) {
    return NextResponse.json(
      { error: "Phone must be exactly 10 digits" },
      { status: 400 },
    );
  }
  if (
    !ticketsBought ||
    typeof ticketsBought !== "object" ||
    Array.isArray(ticketsBought) ||
    Object.keys(ticketsBought as object).length === 0
  ) {
    return NextResponse.json(
      { error: "ticketsBought must be a non-empty object" },
      { status: 400 },
    );
  }

  try {
    const result = await createCounterBooking({
      eventId,
      firstName,
      email,
      phone,
      ticketsBought: ticketsBought as Record<string, number>,
      bookingCategory,
      paymentMode,
      paymentStatus,
      formResponse:
        formResponse &&
        typeof formResponse === "object" &&
        !Array.isArray(formResponse)
          ? (formResponse as Record<string, unknown>)
          : undefined,
    });

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
