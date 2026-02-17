"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { type BookingDetail } from "@/lib/events/service";
import { format } from "date-fns";
import {
    User,
    Ticket,
    CreditCard,
    Tag,
    CheckCircle,
    Hash,
    IdentificationCard,
    Clock,
    DownloadSimple,
} from "@phosphor-icons/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface BookingDetailsModalProps {
    booking: BookingDetail | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function toReadableLabel(value: string) {
    return value
        .replace(/[_-]+/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function statusColor(status: string) {
    switch (status.toLowerCase()) {
        case "paid":
            return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
        case "pending":
            return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
        case "failed":
            return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
        case "refunded":
            return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
        default:
            return "bg-muted text-muted-foreground border-border";
    }
}

function DetailItem({ label, value, className = "" }: { label: string; value: React.ReactNode; className?: string }) {
    return (
        <div className={`space-y-1 ${className}`}>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {label}
            </span>
            <div className="text-sm font-medium text-foreground break-words">
                {value}
            </div>
        </div>
    );
}

function isValidFormResponse(response: any): boolean {
    if (!response || typeof response !== "object" || Array.isArray(response)) return false;
    return Object.keys(response).length > 0;
}

function renderValue(value: any): React.ReactNode {
    if (value === null || value === undefined) return "N/A";

    if (typeof value === "string") {
        if (value.startsWith("http")) {
            return (
                <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline break-all"
                >
                    {value}
                </a>
            );
        }
        return value;
    }

    if (typeof value === "object") {
        return (
            <pre className="whitespace-pre-wrap font-sans text-xs">
                {JSON.stringify(value, null, 2)}
            </pre>
        );
    }

    return String(value);
}

export function BookingDetailsModal({
    booking,
    open,
    onOpenChange,
}: BookingDetailsModalProps) {
    if (!booking) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col gap-0 border-l border-border/60 shadow-2xl">
                <SheetHeader className="px-6 py-5 border-b border-border/60 bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 pr-8">
                            <div className="flex items-center gap-3">
                                <SheetTitle className="text-xl font-bold tracking-tight">Registration Details</SheetTitle>
                                <div
                                    className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${statusColor(
                                        booking.paymentStatus
                                    )}`}
                                >
                                    {booking.paymentStatus}
                                </div>
                            </div>
                            <SheetDescription className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-muted-foreground">
                                    ID: {booking.id}
                                </span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(booking.id)}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                                    title="Copy ID"
                                >
                                    <Hash size={12} />
                                </button>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="px-6 py-8 space-y-8">
                        {/* User Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <User size={16} weight="bold" />
                                </div>
                                Customer Information
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 pl-9">
                                <DetailItem label="Name" value={booking.userName || booking.name || "Guest User"} />
                                <DetailItem label="Email" value={booking.userEmail || "N/A"} />
                                <DetailItem label="Phone" value={booking.userPhone || "N/A"} />
                                <DetailItem
                                    label="User ID"
                                    value={booking.userId ? (
                                        <span className="font-mono text-xs text-muted-foreground">{booking.userId}</span>
                                    ) : <span className="text-muted-foreground italic">Guest</span>}
                                />
                            </div>
                        </div>

                        <Separator className="bg-border/60" />

                        {/* Event & Ticket Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <Ticket size={16} weight="bold" />
                                </div>
                                Event & Ticket Details
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 pl-9">
                                <DetailItem label="Event" value={booking.eventName} className="sm:col-span-2" />
                                <DetailItem label="Ticket Type" value={booking.ticketName} />
                                <DetailItem label="Quantity" value={booking.quantity.toString()} />
                                {booking.ticketsBought && Object.keys(booking.ticketsBought).length > 0 && (
                                    <div className="sm:col-span-2 space-y-2">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            Ticket Breakdown
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(booking.ticketsBought).map(([ticket, count]) => (
                                                <div key={ticket} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs font-medium text-foreground">
                                                    <Tag size={12} className="text-muted-foreground" />
                                                    <span>{ticket}</span>
                                                    <span className="text-muted-foreground">x{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator className="bg-border/60" />

                        {/* Payment Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <CreditCard size={16} weight="bold" />
                                </div>
                                Payment Information
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 pl-9">
                                <DetailItem label="Amount Paid" value={formatCurrency(booking.finalAmount)} />
                                <DetailItem label="Total Value" value={formatCurrency(booking.totalAmount)} />
                                <DetailItem
                                    label="Transaction ID"
                                    value={booking.transactionId ? (
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs">{booking.transactionId}</span>
                                            <button
                                                onClick={() => booking.transactionId && navigator.clipboard.writeText(booking.transactionId)}
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                                title="Copy Transaction ID"
                                            >
                                                <Hash size={12} />
                                            </button>
                                        </div>
                                    ) : "N/A"}
                                    className="sm:col-span-2"
                                />
                                {booking.couponCode && (
                                    <DetailItem
                                        label="Coupon Used"
                                        value={
                                            <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                <Tag size={12} weight="fill" />
                                                {booking.couponCode}
                                            </div>
                                        }
                                    />
                                )}
                            </div>
                        </div>

                        <Separator className="bg-border/60" />

                        {/* Form Responses */}
                        {booking.formResponse && isValidFormResponse(booking.formResponse) && (
                            <>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                            <IdentificationCard size={16} weight="bold" />
                                        </div>
                                        Additional Information
                                    </div>
                                    <div className="space-y-4 pl-9">
                                        {Object.entries(booking.formResponse as Record<string, any>).map(([key, value]) => (
                                            <div key={key} className="group rounded-lg border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40 hover:border-border">
                                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                                                    {toReadableLabel(key)}
                                                </span>
                                                <div className="text-sm text-foreground">
                                                    {renderValue(value)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Separator className="bg-border/60" />
                            </>
                        )}

                        {/* Metadata */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <Clock size={16} weight="bold" />
                                </div>
                                Timestamps & Status
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 pl-9">
                                <DetailItem
                                    label="Registered On"
                                    value={format(new Date(booking.createdAt), "PPP p")}
                                    className="sm:col-span-2"
                                />
                                {booking.updatedAt !== booking.createdAt && (
                                    <DetailItem
                                        label="Last Updated"
                                        value={format(new Date(booking.updatedAt), "PPP p")}
                                        className="sm:col-span-2"
                                    />
                                )}
                                {booking.ticketUrl && (
                                    <DetailItem
                                        label="Ticket Document"
                                        value={
                                            <a
                                                href={booking.ticketUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                                            >
                                                <DownloadSimple size={16} weight="bold" />
                                                Download Ticket PDF
                                            </a>
                                        }
                                        className="sm:col-span-2 pt-2"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
