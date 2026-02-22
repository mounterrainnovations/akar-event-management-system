"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Receipt,
    Ticket,
    User,
    EnvelopeSimple,
    Phone,
    Warning,
    CircleNotch,
    ClipboardText,
    MagnifyingGlass,
    Tag,
    DownloadSimple,
    Info,
    List,
} from "@phosphor-icons/react";
import {
    listAllRegistrationsAction,
    resendBookingEmailAction,
    listOfflineRegistrationsAction,
    updateOfflineRegistrationStatusAction
} from "@/app/admin/events-new-actions";
import { type BookingDetail } from "@/lib/events/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BookingDetailsModal } from "./BookingDetailsModal";
import { format } from "date-fns";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "event" | "tickets" | "attendee" | "payment";

interface PublicEvent {
    id: string;
    name: string;
    status: string;
}

interface EventTicket {
    id: string;
    name: string;
    type: string;
    price: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = ["event", "tickets", "attendee", "payment"];

const STEP_META: Record<Step, { number: number; label: string; icon: React.ReactNode }> = {
    event: { number: 1, label: "Select Event", icon: <Receipt size={14} weight="bold" /> },
    tickets: { number: 2, label: "Choose Tickets", icon: <Ticket size={14} weight="bold" /> },
    attendee: { number: 3, label: "Attendee Details", icon: <User size={14} weight="bold" /> },
    payment: { number: 4, label: "Payment Details", icon: <Receipt size={14} weight="bold" /> },
};

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);
}

function toReadableLabel(str: string) {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, function (s) { return s.toUpperCase(); });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CounterBookingSectionManager() {
    const formTopRef = useRef<HTMLDivElement>(null);

    // Step state
    const [currentStep, setCurrentStep] = useState<Step>("event");

    // Step 1 — event
    const [events, setEvents] = useState<PublicEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState("");

    // Step 2 — tickets
    const [tickets, setTickets] = useState<EventTicket[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Step 3 — attendee
    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [bookingCategory, setBookingCategory] = useState("Paid");

    // Step 4 — payment
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [paymentStatus, setPaymentStatus] = useState("Paid");

    // "list" shows the recent bookings table; "form" shows the new booking wizard
    const [view, setView] = useState<"list" | "form">("list");
    const [offlineBookings, setOfflineBookings] = useState<BookingDetail[]>([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);

    // Filter state
    const [searchTerm, setSearchTerm] = useState("");

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [successBookingId, setSuccessBookingId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Update Status logic
    const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);

    // ── Load events once ──────────────────────────────────────────────────────
    useEffect(() => {
        fetch("/api/events")
            .then((r) => r.json())
            .then((data) => {
                const list: PublicEvent[] = (Array.isArray(data) ? data : data?.events ?? []).filter(
                    (e: PublicEvent) => ["published", "waitlist", "completed"].includes(e.status),
                );
                setEvents(list);
            })
            .catch(() => setEvents([]))
            .finally(() => setEventsLoading(false));
    }, []);

    // ── Load tickets when event changes ──────────────────────────────────────
    useEffect(() => {
        if (!selectedEventId) { setTickets([]); setQuantities({}); return; }
        setTicketsLoading(true);
        fetch(`/api/events/${selectedEventId}`)
            .then((r) => r.json())
            .then((d) => {
                const raw: unknown[] = Array.isArray(d.tickets) ? d.tickets : [];
                const mapped: EventTicket[] = raw.map((t) => {
                    const ticket = t as Record<string, unknown>;
                    const desc =
                        ticket.description && typeof ticket.description === "object" && !Array.isArray(ticket.description)
                            ? (ticket.description as Record<string, unknown>)
                            : {};
                    return {
                        id: String(ticket.id ?? ""),
                        name: String(desc.name ?? ticket.name ?? "Ticket"),
                        type: String(desc.type ?? ticket.type ?? "Standard"),
                        price: Number(ticket.price ?? 0),
                    };
                });
                setTickets(mapped);
                const init: Record<string, number> = {};
                mapped.forEach((t) => { init[t.id] = 0; });
                setQuantities(init);
            })
            .catch(() => { setTickets([]); setQuantities({}); })
            .finally(() => setTicketsLoading(false));
    }, [selectedEventId]);

    // Load offline bookings
    useEffect(() => {
        let mounted = true;
        async function fetchOfflineBookings() {
            if (view !== "list") return;
            setIsLoadingBookings(true);
            try {
                const res = await listOfflineRegistrationsAction();
                if (res.success && res.bookings) {
                    if (mounted) setOfflineBookings(res.bookings as BookingDetail[]);
                } else {
                    toast.error(res.error || "Failed to load offline bookings");
                }
            } catch (err) {
                console.error(err);
                toast.error("An error occurred loading bookings");
            } finally {
                if (mounted) setIsLoadingBookings(false);
            }
        }
        fetchOfflineBookings();
        return () => { mounted = false; };
    }, [view]);

    const handleStatusChange = async (bookingId: string, newStatus: string) => {
        setUpdatingBookingId(bookingId);
        try {
            const res = await updateOfflineRegistrationStatusAction(bookingId, newStatus);
            if (res.success) {
                toast.success("Payment status updated! The ticket has been sent to the attendee.");

                // Update local state to show changes immediately
                setOfflineBookings(prev => prev.map(booking => {
                    if (booking.id === bookingId) {
                        return {
                            ...booking,
                            paymentStatus: newStatus.toLowerCase(),
                            formResponse: {
                                ...(typeof booking.formResponse === 'object' ? booking.formResponse : {}),
                                _offline_payment_status: newStatus
                            }
                        };
                    }
                    return booking;
                }));
            } else {
                toast.error(res.error || "Failed to update payment status");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while updating status");
        } finally {
            setUpdatingBookingId(null);
        }
    };

    const handleStatusChangeConfirm = (bookingId: string, newStatus: string) => {
        if (window.confirm(`Are you sure you want to change this booking's status to ${newStatus.toUpperCase()}?`)) {
            handleStatusChange(bookingId, newStatus);
        }
    };

    // Data filtering for the list
    const filteredBookings = useMemo(() => {
        if (!searchTerm) return offlineBookings;
        const q = searchTerm.toLowerCase();
        return offlineBookings.filter((b) => {
            const nameSearch = b.userName?.toLowerCase() || b.name?.toLowerCase() || "";
            const emailSearch = b.userEmail?.toLowerCase() || "";
            const eventSearch = b.eventName?.toLowerCase() || "";
            const fr = b.formResponse as Record<string, unknown> | undefined;
            const offlineNameSearch = (typeof fr?._offline_name === "string" ? fr._offline_name : "").toLowerCase();
            const offlineEmailSearch = (typeof fr?._offline_email === "string" ? fr._offline_email : "").toLowerCase();
            const idSearch = b.id?.toLowerCase() || "";
            return (
                nameSearch.includes(q) ||
                offlineNameSearch.includes(q) ||
                emailSearch.includes(q) ||
                offlineEmailSearch.includes(q) ||
                eventSearch.includes(q) ||
                idSearch.includes(q)
            );
        });
    }, [offlineBookings, searchTerm]);

    // ── Computed ──────────────────────────────────────────────────────────────
    const selectedEvent = events.find((e) => e.id === selectedEventId);

    const totalAmount = tickets.reduce((sum, t) => sum + t.price * (quantities[t.id] ?? 0), 0);

    const hasTickets = Object.values(quantities).some((q) => q > 0);

    // ── Navigation ────────────────────────────────────────────────────────────
    const scrollTop = () => formTopRef.current?.scrollIntoView({ behavior: "smooth" });

    const handleNext = () => {
        if (currentStep === "event") {
            if (!selectedEventId) { setFieldErrors({ event: "Please select an event" }); return; }
            setFieldErrors({});
            setCurrentStep("tickets");
        } else if (currentStep === "tickets") {
            if (!hasTickets) { setFieldErrors({ tickets: "Select at least one ticket" }); return; }
            setFieldErrors({});
            setCurrentStep("attendee");
        } else if (currentStep === "attendee") {
            const errs: Record<string, string> = {};
            if (!firstName.trim()) errs.firstName = "Name is required";
            if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Valid email is required";
            if (!phone.trim()) errs.phone = "Phone number is required";
            if (Object.keys(errs).length) { setFieldErrors(errs); return; }
            setFieldErrors({});
            setCurrentStep("payment");
        }
        scrollTop();
    };

    const handlePrev = () => {
        if (currentStep === "tickets") setCurrentStep("event");
        if (currentStep === "attendee") setCurrentStep("tickets");
        if (currentStep === "payment") setCurrentStep("attendee");
        scrollTop();
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setErrorMsg(null);
        setFieldErrors({});

        try {
            const ticketsBought = Object.fromEntries(
                Object.entries(quantities).filter(([, q]) => q > 0),
            );
            const res = await fetch("/api/admin/counter-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId: selectedEventId, firstName, email, phone, ticketsBought, bookingCategory, paymentMode, paymentStatus }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Booking failed");
            setSuccessBookingId(data.bookingId);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Reset ─────────────────────────────────────────────────────────────────
    const handleReset = () => {
        setCurrentStep("event");
        setSelectedEventId("");
        setTickets([]);
        setQuantities({});
        setFirstName("");
        setEmail("");
        setPhone("");
        setBookingCategory("Paid");
        setPaymentMode("Cash");
        setPaymentStatus("Paid");
        setSuccessBookingId(null);
        setErrorMsg(null);
        setFieldErrors({});
        scrollTop();
    };

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN FORM
    // ─────────────────────────────────────────────────────────────────────────
    const stepIndex = STEPS.indexOf(currentStep);
    const isLastStep = currentStep === "payment";

    // ─────────────────────────────────────────────────────────────────────────
    // SUCCESS STATE
    // ─────────────────────────────────────────────────────────────────────────
    if (successBookingId) {
        return (
            <div className="flex h-full flex-col bg-background">
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-2xl">
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
                            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500/10">
                                <CheckCircle size={48} weight="fill" className="text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold text-foreground">Booking Confirmed!</h2>
                                <p className="text-sm text-muted-foreground">
                                    Ticket emailed to <span className="font-medium text-foreground">{email}</span>
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-card px-8 py-5 text-center">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Booking ID</p>
                                <p className="font-mono text-sm font-bold text-foreground">{successBookingId}</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button onClick={handleReset} className="gap-2">
                                    <Receipt size={16} weight="bold" />
                                    New Booking
                                </Button>
                                <Button
                                    onClick={() => {
                                        handleReset();
                                        setView("list");
                                    }}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <List size={16} weight="bold" />
                                    Go to Counter Booking
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LIST VIEW STATE
    // ─────────────────────────────────────────────────────────────────────────
    if (view === "list") {
        return (
            <div className="flex h-full flex-col bg-background">
                <div className="flex items-center justify-between border-b border-border/40 bg-card/50 px-6 py-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            Counter Bookings
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage all offline bookings and box office counter sales.
                        </p>
                    </div>
                    <Button onClick={() => setView("form")} className="gap-2">
                        <User size={16} weight="bold" />
                        New Booking
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-7xl space-y-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center py-2">
                            <div className="relative w-full md:w-80">
                                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input
                                    placeholder="Search by name, email, or booking ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-10 w-full rounded-full bg-muted/20 border-border/60"
                                />
                            </div>
                        </div>

                        {isLoadingBookings ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
                                <ClipboardText className="mb-4 text-muted-foreground" size={48} weight="light" />
                                <h3 className="text-lg font-medium text-foreground">No bookings found</h3>
                                <p className="text-sm text-muted-foreground mt-1 mb-4">
                                    {searchTerm ? "Try adjusting your search filters." : "There are no offline bookings yet."}
                                </p>
                                {!searchTerm && (
                                    <Button onClick={() => setView("form")} variant="outline" className="gap-2">
                                        Create First Booking
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                                            <tr>
                                                <th className="px-6 py-4 w-[250px]">Attendee & Event</th>
                                                <th className="px-6 py-4">Tickets & Info</th>
                                                <th className="px-6 py-4">Payment</th>
                                                <th className="px-6 py-4 w-[140px] text-right">Ticket</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {filteredBookings.map((b: BookingDetail) => {
                                                const fr = b.formResponse as Record<string, unknown> | undefined;
                                                const name = typeof fr?._offline_name === "string" ? fr._offline_name : b.userName || "Unknown";
                                                const email = typeof fr?._offline_email === "string" ? fr._offline_email : b.userEmail || "N/A";
                                                const category = typeof fr?._offline_category === "string" ? fr._offline_category : "Paid";
                                                const payMode = typeof fr?._offline_payment_mode === "string" ? fr._offline_payment_mode : "N/A";
                                                const originalPayStatus = typeof fr?._offline_payment_status === "string" ? fr._offline_payment_status : "Unknown";
                                                const currentDbStatus = b.paymentStatus?.toLowerCase() || "unknown";
                                                const payStatusValue = ["paid", "pending", "failed"].includes(currentDbStatus) ? currentDbStatus : "pending";

                                                return (
                                                    <tr key={b.id} className="hover:bg-muted/10 transition-colors">
                                                        <td className="px-6 py-4 align-top">
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-medium text-foreground line-clamp-1">{name}</div>
                                                                <button
                                                                    onClick={() => setSelectedBooking(b)}
                                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <Info size={16} weight="bold" />
                                                                </button>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground truncate max-w-[200px] mb-2">{email}</div>
                                                            <div className="text-xs font-medium text-primary line-clamp-1 flex items-center gap-1.5 mt-1">
                                                                <Tag size={12} weight="fill" />
                                                                {b.eventName}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 align-top">
                                                            <div className="font-medium text-foreground">
                                                                {b.quantity} x {b.ticketName}
                                                            </div>
                                                            <div className="inline-flex mt-2 items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500 border border-emerald-500/20">
                                                                {category}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 align-top">
                                                            <div className="font-medium text-foreground">₹{b.totalAmount}</div>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <Select
                                                                    disabled={updatingBookingId === b.id}
                                                                    value={payStatusValue}
                                                                    onValueChange={(val) => handleStatusChangeConfirm(b.id, val)}
                                                                >
                                                                    <SelectTrigger className={`h-6 text-[11px] font-semibold uppercase tracking-wider px-2 border-0 w-[110px] ${payStatusValue === "paid" ? "text-emerald-500 bg-emerald-500/10" :
                                                                        payStatusValue === "failed" ? "text-red-500 bg-red-500/10" :
                                                                            "text-amber-500 bg-amber-500/10"
                                                                        }`}>
                                                                        {updatingBookingId === b.id ? "UPDATING..." : <SelectValue placeholder="Status" />}
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="paid">Paid</SelectItem>
                                                                        <SelectItem value="pending">Pending</SelectItem>
                                                                        <SelectItem value="failed">Failed/Cancelled</SelectItem>
                                                                    </SelectContent>
                                                                </Select>

                                                                <span className="text-border/40">•</span>
                                                                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                                                    {payMode}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 align-top text-right">
                                                            {payStatusValue === "paid" ? (
                                                                b.ticketUrl ? (
                                                                    <Button variant="outline" size="sm" className="gap-1.5 text-[10px] h-7 px-2" onClick={() => window.open(b.ticketUrl!, "_blank")}>
                                                                        <DownloadSimple size={14} /> Download
                                                                    </Button>
                                                                ) : (
                                                                    <div className="text-[11px] text-muted-foreground mt-1">Generating...</div>
                                                                )
                                                            ) : (
                                                                <div className="text-[11px] text-muted-foreground mt-1">Pending Payment</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {selectedBooking && selectedBooking.id && (
                    <BookingDetailsModal
                        booking={selectedBooking}
                        open={!!selectedBooking}
                        onOpenChange={(open) => {
                            if (!open) setSelectedBooking(null);
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-background">
            {/* ── Top Bar ─────────────────────────────────────────────────── */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/40 bg-card px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground">
                        <Receipt className="size-4" weight="bold" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Counter Booking</h2>
                        <p className="text-xs text-muted-foreground">
                            Step {STEP_META[currentStep].number} — {STEP_META[currentStep].label}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Scrollable Content ──────────────────────────────────────── */}
            <div ref={formTopRef} className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="mx-auto max-w-2xl space-y-8">

                    {/* ── Stepper ────────────────────────────────────────── */}
                    <div className="flex items-center justify-center gap-3">
                        {STEPS.map((step, idx) => {
                            const isActive = currentStep === step;
                            const isCompleted = stepIndex > idx;
                            const circleClass = isActive
                                ? "border-primary bg-primary/10 text-primary"
                                : isCompleted
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-muted-foreground/30 bg-muted/30 text-muted-foreground";
                            const labelClass = isActive
                                ? "text-foreground font-semibold"
                                : isCompleted
                                    ? "text-emerald-600"
                                    : "text-muted-foreground";
                            return (
                                <div key={step} className="flex items-center gap-2">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`flex size-8 items-center justify-center rounded-full border-2 text-sm font-bold ${circleClass}`}>
                                            {isCompleted ? <CheckCircle weight="bold" size={16} /> : idx + 1}
                                        </div>
                                        <span className={`hidden sm:block text-[10px] tracking-wide uppercase ${labelClass}`}>
                                            {STEP_META[step].label}
                                        </span>
                                    </div>
                                    {idx < STEPS.length - 1 && (
                                        <div className={`mb-4 hidden sm:block h-0.5 w-10 ${isCompleted ? "bg-emerald-400" : "bg-border"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Step 1: Select Event ────────────────────────────── */}
                    {currentStep === "event" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="rounded-xl border border-border/60 bg-card p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Receipt size={16} weight="bold" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">Event Selection</h3>
                                        <p className="text-xs text-muted-foreground">Choose the event for this offline booking</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Event <span className="text-red-500">*</span>
                                    </label>
                                    {eventsLoading ? (
                                        <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
                                            <CircleNotch size={16} className="animate-spin" />
                                            Loading events…
                                        </div>
                                    ) : (
                                        <Select value={selectedEventId} onValueChange={(v) => { setSelectedEventId(v); setFieldErrors({}); }}>
                                            <SelectTrigger className={fieldErrors.event ? "border-red-500" : ""}>
                                                <SelectValue placeholder="Select an event…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {events.length === 0 ? (
                                                    <SelectItem value="__none" disabled>No active events found</SelectItem>
                                                ) : (
                                                    events.map((e) => (
                                                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {fieldErrors.event && (
                                        <p className="flex items-center gap-1 text-xs text-red-500">
                                            <Warning size={12} /> {fieldErrors.event}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Tickets ─────────────────────────────────── */}
                    {currentStep === "tickets" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="rounded-xl border border-border/60 bg-card p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Ticket size={16} weight="bold" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">Ticket Selection</h3>
                                        <p className="text-xs text-muted-foreground">{selectedEvent?.name}</p>
                                    </div>
                                </div>

                                {ticketsLoading ? (
                                    <div className="flex h-16 items-center gap-2 text-sm text-muted-foreground">
                                        <CircleNotch size={16} className="animate-spin" />
                                        Loading tickets…
                                    </div>
                                ) : tickets.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No tickets found for this event.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {tickets.map((ticket) => {
                                            const qty = quantities[ticket.id] ?? 0;
                                            return (
                                                <div
                                                    key={ticket.id}
                                                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${qty > 0 ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background"}`}
                                                >
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">{ticket.name}</p>
                                                        <p className="text-xs text-muted-foreground">{ticket.type} · {formatCurrency(ticket.price)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setQuantities((q) => ({ ...q, [ticket.id]: Math.max(0, (q[ticket.id] ?? 0) - 1) }))}
                                                            className="flex size-7 items-center justify-center rounded-full border border-border/60 bg-background text-sm font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                                                            disabled={qty === 0}
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-semibold tabular-nums">{qty}</span>
                                                        <button
                                                            onClick={() => setQuantities((q) => ({ ...q, [ticket.id]: (q[ticket.id] ?? 0) + 1 }))}
                                                            className="flex size-7 items-center justify-center rounded-full border border-border/60 bg-background text-sm font-bold text-foreground hover:bg-muted transition-colors"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {fieldErrors.tickets && (
                                    <p className="mt-3 flex items-center gap-1 text-xs text-red-500">
                                        <Warning size={12} /> {fieldErrors.tickets}
                                    </p>
                                )}
                            </div>

                            {/* Total */}
                            {hasTickets && (
                                <div className="rounded-xl border border-border/60 bg-card px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Total (offline payment)</span>
                                        <span className="text-lg font-bold text-foreground">{formatCurrency(totalAmount)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 3: Attendee Details ─────────────────────────── */}
                    {currentStep === "attendee" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="rounded-xl border border-border/60 bg-card p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <User size={16} weight="bold" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">Attendee Details</h3>
                                        <p className="text-xs text-muted-foreground">Ticket will be emailed to the attendee</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                className={`pl-8 ${fieldErrors.firstName ? "border-red-500" : ""}`}
                                                placeholder="e.g. Priya Sharma"
                                                value={firstName}
                                                onChange={(e) => { setFirstName(e.target.value); setFieldErrors((f) => ({ ...f, firstName: "" })); }}
                                            />
                                        </div>
                                        {fieldErrors.firstName && (
                                            <p className="flex items-center gap-1 text-xs text-red-500"><Warning size={12} /> {fieldErrors.firstName}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <EnvelopeSimple size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                type="email"
                                                className={`pl-8 ${fieldErrors.email ? "border-red-500" : ""}`}
                                                placeholder="attendee@example.com"
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: "" })); }}
                                            />
                                        </div>
                                        {fieldErrors.email && (
                                            <p className="flex items-center gap-1 text-xs text-red-500"><Warning size={12} /> {fieldErrors.email}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                type="tel"
                                                className={`pl-8 ${fieldErrors.phone ? "border-red-500" : ""}`}
                                                placeholder="+91 98765 43210"
                                                value={phone}
                                                onChange={(e) => { setPhone(e.target.value); setFieldErrors((f) => ({ ...f, phone: "" })); }}
                                            />
                                        </div>
                                        {fieldErrors.phone && (
                                            <p className="flex items-center gap-1 text-xs text-red-500"><Warning size={12} /> {fieldErrors.phone}</p>
                                        )}
                                    </div>

                                    {/* Booking Category */}
                                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                                        <label className="text-sm font-medium text-foreground pb-1 block">
                                            Booking Category <span className="text-red-500">*</span>
                                        </label>
                                        <Select value={bookingCategory} onValueChange={setBookingCategory}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Paid">Paid</SelectItem>
                                                <SelectItem value="Complimentary">Complimentary</SelectItem>
                                                <SelectItem value="Internal">Internal</SelectItem>
                                                <SelectItem value="Sponsored">Sponsored</SelectItem>
                                                <SelectItem value="Adjustment">Adjustment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: Payment Details ─────────────────────────── */}
                    {currentStep === "payment" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="rounded-xl border border-border/60 bg-card p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Receipt size={16} weight="bold" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">Payment Details</h3>
                                        <p className="text-xs text-muted-foreground">Select how this booking was settled</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Mode of Payment */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground pb-1 block">
                                            Mode of Payment <span className="text-red-500">*</span>
                                        </label>
                                        <Select value={paymentMode} onValueChange={setPaymentMode}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Cash">Cash</SelectItem>
                                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="UPI">UPI</SelectItem>
                                                <SelectItem value="Cheque">Cheque</SelectItem>
                                                <SelectItem value="Credit Card (Manual)">Credit Card (Manual)</SelectItem>
                                                <SelectItem value="Pending / To be collected">Pending / To be collected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Payment Status */}
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-sm font-medium text-foreground pb-1 block">
                                            Payment Status <span className="text-red-500">*</span>
                                        </label>
                                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pending">Pending</SelectItem>
                                                <SelectItem value="Partial Paid">Partial Paid</SelectItem>
                                                <SelectItem value="Paid">Paid</SelectItem>
                                                <SelectItem value="Refunded">Refunded</SelectItem>
                                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-1">Status changes will determine if ticket email is pushed (Paid statuses).</p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary card */}
                            <div className="rounded-xl border border-border/60 bg-card px-6 py-4 space-y-2">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Booking Summary</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Event</span>
                                    <span className="font-medium text-foreground">{selectedEvent?.name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Attendee</span>
                                    <span className="font-medium text-foreground">{firstName}</span>
                                </div>
                                {tickets.filter((t) => (quantities[t.id] ?? 0) > 0).map((t) => (
                                    <div key={t.id} className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{t.name} ×{quantities[t.id]}</span>
                                        <span className="font-medium text-foreground">{formatCurrency(t.price * quantities[t.id])}</span>
                                    </div>
                                ))}
                                <div className="border-t border-border/60 pt-2 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-foreground">Total</span>
                                    <span className="text-base font-bold text-foreground">{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    <Warning size={16} className="mt-0.5 shrink-0" />
                                    {errorMsg}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Footer Nav ───────────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-border/40 bg-card px-6 py-4">
                <div className="mx-auto flex max-w-2xl items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentStep === "event" || submitting}
                        className="gap-2"
                    >
                        <ArrowLeft size={14} weight="bold" />
                        Back
                    </Button>

                    {isLastStep ? (
                        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                            {submitting ? (
                                <>
                                    <CircleNotch size={14} className="animate-spin" />
                                    Creating…
                                </>
                            ) : (
                                <>
                                    <Receipt size={14} weight="bold" />
                                    Create Booking
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleNext} className="gap-2">
                            Continue
                            <ArrowRight size={14} weight="bold" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
