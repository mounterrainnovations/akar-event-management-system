'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, XCircle, Download, Loader2 } from "lucide-react";
import { instrumentSerif } from "@/lib/fonts";
import { getBackendUrl } from "@/lib/backend";

type SearchParams = Record<string, string | string[] | undefined>;

type BookingStatusVariant = "success" | "failure" | "pending";

type BookingStatusPageProps = {
  variant: BookingStatusVariant;
  searchParams?: SearchParams;
};

const variantConfig = {
  success: {
    title: "Booking Confirmed",
    description:
      "Your booking is complete and your payment has been recorded successfully.",
    pill: "Payment Successful",
    iconClassName: "bg-emerald-50 text-emerald-600 border-emerald-200",
    pillClassName: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  failure: {
    title: "Booking Failed",
    description:
      "We could not confirm your payment. You can retry the booking flow from the event page.",
    pill: "Payment Failed",
    iconClassName: "bg-red-50 text-red-600 border-red-200",
    pillClassName: "bg-red-50 text-red-700 border-red-200",
  },
  pending: {
    title: "Booking Pending",
    description:
      "Your payment is still being processed. Please wait a moment and check your booking status shortly.",
    pill: "Payment Pending",
    iconClassName: "bg-amber-50 text-amber-700 border-amber-200",
    pillClassName: "bg-amber-50 text-amber-700 border-amber-200",
  },
} as const;

function getParamValue(
  searchParams: SearchParams | undefined,
  key: string,
): string | null {
  const value = searchParams?.[key];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function getIcon(variant: BookingStatusVariant) {
  if (variant === "success") {
    return CheckCircle2;
  }
  if (variant === "failure") {
    return XCircle;
  }
  return Clock3;
}

export default function BookingStatusPage({
  variant,
  searchParams,
}: BookingStatusPageProps) {
  const config = variantConfig[variant];
  const Icon = getIcon(variant);

  const registrationId = getParamValue(searchParams, "registrationId");
  const transactionId = getParamValue(searchParams, "txnid");
  const gatewayStatus = getParamValue(searchParams, "status");
  const gatewayMessage = getParamValue(searchParams, "message");
  const queryEventId =
    getParamValue(searchParams, "eventId") ??
    getParamValue(searchParams, "event_id");
  const [storedEventId, setStoredEventId] = useState<string | null>(null);
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eventId = sessionStorage.getItem("booking:lastEventId");
    if (eventId) setStoredEventId(eventId);
  }, []);

  useEffect(() => {
    if (variant !== "success" || !registrationId) return;

    let pollInterval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 15;

    const fetchBooking = async () => {
      try {
        const response = await fetch(`${getBackendUrl()}/api/bookings/${registrationId}`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.booking?.ticketUrl) {
          setTicketUrl(data.booking.ticketUrl);
          setIsPolling(false);
          clearInterval(pollInterval);
        } else {
          setIsPolling(true);
        }
      } catch (err) {
        console.error("Error fetching ticket status:", err);
      }
    };

    fetchBooking();
    pollInterval = setInterval(() => {
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        setIsPolling(false);
        return;
      }
      fetchBooking();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [variant, registrationId]);

  const retryEventId = queryEventId ?? storedEventId;

  return (
    <main className="min-h-screen bg-white pt-32 pb-20 px-8 md:px-12 lg:px-16 text-[#1a1a1a]">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 md:p-12 shadow-[0_16px_50px_rgba(0,0,0,0.08)]">
          <div
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-8 ${config.iconClassName}`}
          >
            <Icon className="w-8 h-8" />
          </div>

          <p
            className={`inline-flex items-center rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-widest mb-6 ${config.pillClassName}`}
          >
            {config.pill}
          </p>

          <h1 className={`${instrumentSerif.className} text-5xl md:text-7xl mb-6 text-black`}>
            {config.title}
          </h1>
          <p className="text-lg md:text-xl text-[#1a1a1a]/60 leading-relaxed mb-8">
            {config.description}
          </p>

          {(registrationId || transactionId || gatewayStatus || gatewayMessage) && (
            <div className="rounded-2xl bg-black/[0.03] border border-black/10 p-5 space-y-3 mb-8">
              {registrationId && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">
                    Registration Id
                  </p>
                  <p className="text-sm md:text-base break-all font-medium">
                    {registrationId}
                  </p>
                </div>
              )}
              {transactionId && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">
                    Transaction Id
                  </p>
                  <p className="text-sm md:text-base break-all font-medium">
                    {transactionId}
                  </p>
                </div>
              )}
              {gatewayStatus && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">
                    Gateway Status
                  </p>
                  <p className="text-sm md:text-base break-all font-medium capitalize">
                    {gatewayStatus}
                  </p>
                </div>
              )}
              {gatewayMessage && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">
                    Message
                  </p>
                  <p className="text-sm md:text-base break-words font-medium">
                    {gatewayMessage}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {variant === "success" && (
              <button
                onClick={() => ticketUrl && window.open(ticketUrl, "_blank")}
                disabled={!ticketUrl && !isPolling}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed group"
              >
                {ticketUrl ? (
                  <>
                    <Download size={18} className="transition-transform group-hover:scale-110" />
                    Download Ticket (PDF)
                  </>
                ) : isPolling ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating Ticket...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download Ticket
                  </>
                )}
              </button>
            )}
            {variant === "failure" && retryEventId && (
              <Link
                href={`/event/${retryEventId}`}
                className="inline-flex items-center justify-center rounded-full bg-[#1a1a1a] px-7 py-3 text-sm font-bold text-white hover:bg-black transition-colors"
              >
                Retry Booking
              </Link>
            )}
            <Link
              href="/events"
              className={`inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold transition-colors ${
                variant === "failure" && retryEventId
                  ? "border border-[#1a1a1a]/20 text-[#1a1a1a] hover:bg-black/5"
                  : "bg-[#1a1a1a] text-white hover:bg-black"
              }`}
            >
              Explore Events
            </Link>
            <Link
              href="/my-bookings"
              className="inline-flex items-center justify-center rounded-full border border-[#1a1a1a]/20 px-7 py-3 text-sm font-bold text-[#1a1a1a] hover:bg-black/5 transition-colors"
            >
              Go to My Bookings
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
