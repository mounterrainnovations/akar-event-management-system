"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    CalendarBlank,
    Tag,
    Clock,
    CheckCircle,
    XCircle,
    MagnifyingGlass,
    Funnel,
    ClipboardText,
    DownloadSimple
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { listAllRegistrationsAction } from "@/app/admin/events-new-actions";
import { type BookingDetail } from "@/lib/events/service";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

function toReadableLabel(value: string) {
    return value
        .replace(/[_-]+/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFormValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "N/A";
    }

    if (typeof value === "string") {
        return value.trim() || "N/A";
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value.length === 0 ? "[]" : value.map((entry) => formatFormValue(entry)).join(", ");
    }

    if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
    }

    return String(value);
}

function isLikelyImageUrl(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith("data:image/")) return true;

    try {
        const url = new URL(trimmed);
        const pathname = url.pathname.toLowerCase();
        return /\.(png|jpe?g|webp|gif|svg|avif|bmp|ico)$/.test(pathname);
    } catch {
        return false;
    }
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value.trim());
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function renderFormValue(value: unknown): ReactNode {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
            return <span className="text-xs text-muted-foreground">N/A</span>;
        }

        if (isLikelyImageUrl(trimmed)) {
            return (
                <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={trimmed}
                        alt="Form response upload"
                        className="max-h-40 w-full rounded-md border border-border/70 object-contain bg-background"
                        loading="lazy"
                    />
                    <a
                        href={trimmed}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary underline-offset-4 hover:underline break-all"
                    >
                        Open image
                    </a>
                </div>
            );
        }

        if (isHttpUrl(trimmed)) {
            return (
                <a
                    href={trimmed}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline-offset-4 hover:underline break-all"
                >
                    {trimmed}
                </a>
            );
        }

        return <span className="text-xs text-foreground break-words">{trimmed}</span>;
    }

    return (
        <pre className="whitespace-pre-wrap break-words font-sans text-xs text-foreground">
            {formatFormValue(value)}
        </pre>
    );
}

function getFormResponseEntries(formResponse: BookingDetail["formResponse"]) {
    if (!formResponse || typeof formResponse !== "object" || Array.isArray(formResponse)) {
        return [];
    }

    return Object.entries(formResponse);
}

function getTicketQuantity(booking: BookingDetail): number {
    const ticketCounts = Object.values(booking.ticketsBought ?? {});
    if (ticketCounts.length === 0) {
        return booking.quantity;
    }

    return ticketCounts.reduce((total, count) => total + (Number(count) || 0), 0);
}

function escapeCsvCell(value: unknown): string {
    const stringValue = value == null ? "" : String(value);
    if (!/[",\n]/.test(stringValue)) {
        return stringValue;
    }
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
}

function statusColor(status: string) {
    switch (status.toLowerCase()) {
        case "paid":
            return "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30";
        case "pending":
            return "bg-amber-500/15 text-amber-400 ring-amber-500/30";
        case "failed":
            return "bg-red-500/15 text-red-400 ring-red-500/30";
        case "refunded":
            return "bg-sky-500/15 text-sky-400 ring-sky-500/30";
        default:
            return "bg-muted text-muted-foreground ring-border";
    }
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function BookingsSectionManager() {
    const [bookings, setBookings] = useState<BookingDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [eventFilter, setEventFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [tierFilter, setTierFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    useEffect(() => {
        async function fetchBookings() {
            setLoading(true);
            try {
                const result = await listAllRegistrationsAction();
                if (result.success && result.bookings) {
                    setBookings(result.bookings);
                } else {
                    setError(result.error || "Failed to load bookings");
                }
            } catch {
                setError("An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        }
        fetchBookings();
    }, []);

    const eventOptions = useMemo(
        () =>
            Array.from(new Set(bookings.map((booking) => booking.eventName)))
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b)),
        [bookings],
    );

    const statusOptions = useMemo(
        () =>
            Array.from(
                new Set(bookings.map((booking) => booking.paymentStatus.toLowerCase())),
            ).sort((a, b) => a.localeCompare(b)),
        [bookings],
    );

    const tierOptions = useMemo(
        () =>
            Array.from(new Set(bookings.map((booking) => booking.ticketName)))
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b)),
        [bookings],
    );

    const filteredBookings = useMemo(() => {
        const lowerSearch = searchTerm.trim().toLowerCase();
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        if (fromDate) {
            fromDate.setHours(0, 0, 0, 0);
        }

        if (toDate) {
            toDate.setHours(23, 59, 59, 999);
        }

        return bookings.filter((booking) => {
            if (lowerSearch) {
                const searchMatch =
                    booking.eventName.toLowerCase().includes(lowerSearch) ||
                    booking.userEmail?.toLowerCase().includes(lowerSearch) ||
                    booking.userName?.toLowerCase().includes(lowerSearch) ||
                    booking.ticketName.toLowerCase().includes(lowerSearch);

                if (!searchMatch) return false;
            }

            if (eventFilter !== "all" && booking.eventName !== eventFilter) return false;
            if (statusFilter !== "all" && booking.paymentStatus.toLowerCase() !== statusFilter) return false;
            if (tierFilter !== "all" && booking.ticketName !== tierFilter) return false;

            if (fromDate || toDate) {
                const bookingDate = new Date(booking.createdAt);
                if (Number.isNaN(bookingDate.getTime())) return false;
                if (fromDate && bookingDate < fromDate) return false;
                if (toDate && bookingDate > toDate) return false;
            }

            return true;
        });
    }, [bookings, searchTerm, eventFilter, statusFilter, tierFilter, dateFrom, dateTo]);

    const activeFilterCount = [
        eventFilter !== "all",
        statusFilter !== "all",
        tierFilter !== "all",
        Boolean(dateFrom),
        Boolean(dateTo),
    ].filter(Boolean).length;

    function clearFilters() {
        setEventFilter("all");
        setStatusFilter("all");
        setTierFilter("all");
        setDateFrom("");
        setDateTo("");
    }

    function downloadCsv(rows: BookingDetail[]) {
        const headers = [
            "Registration ID",
            "Customer Name",
            "Customer Email",
            "Event",
            "Tier",
            "Quantity",
            "Final Amount",
            "Payment Status",
            "Created At",
            "Form Response",
        ];

        const lines = rows.map((booking) =>
            [
                booking.id,
                booking.userName || booking.name || "",
                booking.userEmail || "",
                booking.eventName,
                booking.ticketName,
                getTicketQuantity(booking),
                booking.finalAmount,
                booking.paymentStatus,
                booking.createdAt,
                JSON.stringify(booking.formResponse ?? {}),
            ]
                .map(escapeCsvCell)
                .join(","),
        );

        const csvContent = [headers.join(","), ...lines].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = format(new Date(), "yyyyMMdd-HHmmss");

        link.href = url;
        link.download = `bookings-${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    if (loading) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
                <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-4 text-sm text-muted-foreground">Loading your bookings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
                <XCircle size={48} className="text-red-500/50 mb-4" />
                <h3 className="text-lg font-semibold">Error Loading Bookings</h3>
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Event Bookings</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {filteredBookings.length} registration{filteredBookings.length !== 1 ? "s" : ""} recorded
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search bookings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 w-[260px] rounded-lg border border-border bg-background pl-9 pr-4 text-sm outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        />
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                                <Funnel size={18} />
                                <span className="sr-only">Open filters</span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[340px] p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-foreground">Filters</p>
                                {activeFilterCount > 0 && (
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearFilters}>
                                        Clear all
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Event</p>
                                    <Select value={eventFilter} onValueChange={setEventFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All events" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All events</SelectItem>
                                            {eventOptions.map((eventName) => (
                                                <SelectItem key={eventName} value={eventName}>
                                                    {eventName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Payment status</p>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All statuses</SelectItem>
                                            {statusOptions.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {toReadableLabel(status)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tier</p>
                                    <Select value={tierFilter} onValueChange={setTierFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All tiers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All tiers</SelectItem>
                                            {tierOptions.map((tier) => (
                                                <SelectItem key={tier} value={tier}>
                                                    {tier}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date from</p>
                                        <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date to</p>
                                        <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 px-3"
                        onClick={() => downloadCsv(filteredBookings)}
                        disabled={filteredBookings.length === 0}
                    >
                        <DownloadSimple size={14} />
                        Download CSV
                    </Button>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Event & Tier</th>
                                <th className="px-6 py-4 font-semibold">Form Response</th>
                                <th className="px-6 py-4 font-semibold">Amount</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <CalendarBlank size={40} weight="thin" className="text-muted-foreground/30 mb-3" />
                                            <p className="text-muted-foreground">No bookings found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{booking.userName || "Guest User"}</span>
                                                <span className="text-[11px] text-muted-foreground">{booking.userEmail || "no email provided"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                    <span>{booking.eventName}</span>
                                                    {booking.isVerified && (
                                                        <CheckCircle size={14} weight="fill" className="text-emerald-500" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground capitalize">
                                                    <Tag size={12} />
                                                    {booking.ticketName} (x{getTicketQuantity(booking)})
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <FormResponsePopover formResponse={booking.formResponse} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{formatCurrency(booking.finalAmount)}</span>

                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${statusColor(booking.paymentStatus)}`}>
                                                {booking.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                                                    <CalendarBlank size={12} />
                                                    {format(new Date(booking.createdAt), "dd MMM, yyyy")}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Clock size={10} />
                                                    {format(new Date(booking.createdAt), "hh:mm a")}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

function FormResponsePopover({ formResponse }: { formResponse: BookingDetail["formResponse"] }) {
    const entries = getFormResponseEntries(formResponse);

    if (entries.length === 0) {
        return <span className="text-xs text-muted-foreground">No response</span>;
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-xs">
                    <ClipboardText size={14} />
                    View ({entries.length})
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[360px] p-0">
                <div className="border-b border-border/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Form Response
                    </p>
                </div>
                <ScrollArea className="h-[320px] w-full">
                    <div className="space-y-3 p-4">
                        {entries.map(([key, value]) => (
                            <div key={key} className="rounded-md border border-border/70 bg-muted/20 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    {toReadableLabel(key)}
                                </p>
                                <div className="mt-1">
                                    {renderFormValue(value)}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
