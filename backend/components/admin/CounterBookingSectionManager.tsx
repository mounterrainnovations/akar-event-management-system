"use client";

import { useEffect, useRef, useState } from "react";
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
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "event" | "tickets" | "attendee";

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

const STEPS: Step[] = ["event", "tickets", "attendee"];

const STEP_META: Record<Step, { number: number; label: string; icon: React.ReactNode }> = {
    event: { number: 1, label: "Select Event", icon: <Receipt size={14} weight="bold" /> },
    tickets: { number: 2, label: "Choose Tickets", icon: <Ticket size={14} weight="bold" /> },
    attendee: { number: 3, label: "Attendee Details", icon: <User size={14} weight="bold" /> },
};

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);
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

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [successBookingId, setSuccessBookingId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        }
        scrollTop();
    };

    const handlePrev = () => {
        if (currentStep === "tickets") setCurrentStep("event");
        if (currentStep === "attendee") setCurrentStep("tickets");
        scrollTop();
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const errs: Record<string, string> = {};
        if (!firstName.trim()) errs.firstName = "Name is required";
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Valid email is required";
        if (!phone.trim()) errs.phone = "Phone number is required";
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }

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
                body: JSON.stringify({ eventId: selectedEventId, firstName, email, phone, ticketsBought }),
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
        setSuccessBookingId(null);
        setErrorMsg(null);
        setFieldErrors({});
        scrollTop();
    };

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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN FORM
    // ─────────────────────────────────────────────────────────────────────────
    const stepIndex = STEPS.indexOf(currentStep);
    const isLastStep = currentStep === "attendee";

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
                                </div>
                            </div>

                            {/* Summary card */}
                            <div className="rounded-xl border border-border/60 bg-card px-6 py-4 space-y-2">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Booking Summary</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Event</span>
                                    <span className="font-medium text-foreground">{selectedEvent?.name}</span>
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
