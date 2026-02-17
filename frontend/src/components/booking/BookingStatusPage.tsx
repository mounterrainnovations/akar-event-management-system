'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { instrumentSerif } from "@/lib/fonts";

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
  const gatewayMessage = getParamValue(searchParams, "message");
  const queryEventId =
    getParamValue(searchParams, "eventId") ??
    getParamValue(searchParams, "event_id");
  const [storedEventId, setStoredEventId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eventId = sessionStorage.getItem("booking:lastEventId");
    if (eventId) setStoredEventId(eventId);
  }, []);

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

          {(registrationId || transactionId || gatewayMessage) && (
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
