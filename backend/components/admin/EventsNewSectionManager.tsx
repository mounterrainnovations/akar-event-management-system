import Link from "next/link";
import {
    CalendarBlank,
    MapPin,
    Eye,
    EyeSlash,
    Plus,
    Archive,
    ShieldCheck,
    CaretRight,
    PencilSimple,
} from "@phosphor-icons/react/dist/ssr";
import { getEventAdminDetail, listEventAdminSummaries, type EventDetail, type EventSummary } from "@/lib/events/service";
import { EventsNewDetailModal } from "./EventsNewDetailModal";
import { EventsNewCreate, type EventFormData } from "./EventsNewCreate";

type EventsNewSectionManagerProps = {
    includeDeleted?: boolean;
    selectedEventId?: string;
    view?: string;
};

function statusColor(status: string) {
    switch (status) {
        case "published":
            return "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30";
        case "draft":
            return "bg-amber-500/15 text-amber-400 ring-amber-500/30";
        case "cancelled":
            return "bg-red-500/15 text-red-400 ring-red-500/30";
        case "completed":
            return "bg-sky-500/15 text-sky-400 ring-sky-500/30";
        default:
            return "bg-muted text-muted-foreground ring-border";
    }
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return "TBD";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

import { EventBannerViewer } from "./EventBannerViewer";

function mapEventDetailToFormData(detail: EventDetail): EventFormData {
    const { event, tickets, coupons, formFields, bundleOffers } = detail;

    const mappedTickets = tickets.map((ticket) => {
        const description =
            ticket.description && typeof ticket.description === "object"
                ? (ticket.description as Record<string, unknown>)
                : null;
        return {
            name: typeof description?.name === "string" ? description.name : "",
            brief:
                typeof description?.brief === "string"
                    ? description.brief
                    : typeof description?.description === "string"
                        ? description.description
                        : "",
            price: ticket.price,
            quantity: ticket.quantity ?? 1,
            maxQuantityPerPerson: ticket.maxQuantityPerPerson ?? 1,
            visibilityConfig:
                ticket.visibilityConfig && typeof ticket.visibilityConfig === "object"
                    ? (ticket.visibilityConfig as Record<string, string[]>)
                    : {},
        };
    });

    const ticketNameById = new Map<string, string>();
    tickets.forEach((ticket, index) => {
        const description =
            ticket.description && typeof ticket.description === "object"
                ? (ticket.description as Record<string, unknown>)
                : null;
        const ticketName =
            typeof description?.name === "string" && description.name.trim()
                ? description.name
                : `Tier ${index + 1}`;
        ticketNameById.set(ticket.id, ticketName);
    });

    const terms = (event.terms_and_conditions || "")
        .split("\n")
        .map((term) => term.trim())
        .filter(Boolean);

    while (terms.length < 3) {
        terms.push("");
    }

    return {
        name: event.name || "",
        baseEventBanner: event.base_event_banner ?? null,
        eventDate: event.event_date ?? "",
        registrationStart: event.registration_start ?? "",
        registrationEnd: event.registration_end ?? "",
        about: event.about ?? "",
        termsAndConditions: terms,
        addressLine1: event.address_line_1 ?? "",
        addressLine2: event.address_line_2 ?? "",
        city: event.city ?? "",
        state: event.state ?? "",
        country: event.country ?? "",
        locationUrl: event.location_url ?? "",
        coupons: coupons.map((coupon) => ({
            code: coupon.code,
            discountValue: coupon.discountValue,
        })),
        formFields: formFields.map((field) => ({
            fieldName: field.fieldName,
            fieldType: field.fieldType as "free_text" | "dropdown" | "image",
            label: field.label,
            isRequired: field.isRequired,
            isHidden: field.isHidden,
            options: Array.isArray(field.options)
                ? (field.options as { value: string; label: string; triggers: string[] }[])
                : [],
            answer: field.answer ?? "",
        })),
        tickets: mappedTickets.length > 0 ? mappedTickets : [
            {
                name: "",
                brief: "",
                price: 0,
                quantity: 100,
                maxQuantityPerPerson: 1,
                visibilityConfig: {},
            },
        ],
        bundleOffers: bundleOffers.map((offer) => ({
            name: offer.name,
            buyQuantity: offer.buyQuantity,
            getQuantity: offer.getQuantity,
            offerType: offer.offerType,
            applicableTicketIds: (offer.applicableTicketIds || []).map(
                (ticketId) => ticketNameById.get(ticketId) || ticketId,
            ),
        })),
    };
}

// ... inside EventRow ...

function EventRow({ event, includeDeleted }: { event: EventSummary; includeDeleted: boolean }) {
    const isArchived = !!event.deletedAt;
    const isCancelled = event.status === "cancelled";
    const includeDeletedQuery = includeDeleted ? "&includeDeleted=1" : "";

    return (
        <div
            className={`group flex items-center gap-4 border-b border-border/40 px-4 py-3.5 transition-colors hover:bg-muted/40 ${isArchived ? "opacity-50" : ""
                }`}
        >
            {/* Banner Thumbnail */}
            <EventBannerViewer bannerUrl={event.bannerUrl} eventName={event.name} />

            {/* Status badge */}
            <span
                className={`inline-flex w-[88px] shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${statusColor(event.status)}`}
            >
                {event.status}
            </span>

            {/* Name + Location + Date — clickable */}
            <Link
                href={`/admin?section=events&eventId=${event.id}${includeDeletedQuery}`}
                className="min-w-0 flex-1"
            >
                <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {event.name}
                    </h3>

                    {event.verificationRequired && (
                        <ShieldCheck className="size-3.5 shrink-0 text-violet-400" weight="fill" />
                    )}
                    {isArchived && (
                        <Archive className="size-3.5 shrink-0 text-neutral-400" weight="fill" />
                    )}
                </div>

                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <CalendarBlank className="size-3" weight="bold" />
                        {formatDate(event.eventDate)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" weight="bold" />
                        {event.city}, {event.state}
                    </span>
                </div>
            </Link>

            {/* Metrics — hidden on small screens */}
            <div className="hidden items-center gap-6 text-xs text-muted-foreground md:flex">
                <div className="w-[72px] text-center">
                    <p className="text-sm font-semibold text-foreground">{event.metrics.registrations}</p>
                    <p className="text-[10px]">Registrants</p>
                </div>
                <div className="w-[72px] text-center">
                    <p className="text-sm font-semibold text-foreground">{event.metrics.totalTicketsSold}</p>
                    <p className="text-[10px]">Tickets</p>
                </div>
                <div className="w-[80px] text-center">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(event.metrics.grossRevenue)}</p>
                    <p className="text-[10px]">Revenue</p>
                </div>
            </div>

            {/* Spacer for Action column alignment */}
            <Link
                href={`/admin?section=events&view=edit&eventId=${event.id}${includeDeletedQuery}`}
                className="inline-flex w-[72px] shrink-0 items-center justify-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
                <PencilSimple className="size-3.5" weight="bold" />
                Edit
            </Link>

            {/* Arrow */}
            <Link
                href={`/admin?section=events&eventId=${event.id}${includeDeletedQuery}`}
                className="shrink-0"
            >
                <CaretRight className="size-4 text-muted-foreground/40 transition-colors group-hover:text-primary" weight="bold" />
            </Link>
        </div>
    );
}

export async function EventsNewSectionManager({
    includeDeleted = false,
    selectedEventId,
    view,
}: EventsNewSectionManagerProps) {
    if (view === "create") {
        return <EventsNewCreate includeDeleted={includeDeleted} />;
    }

    if (view === "edit" && selectedEventId) {
        const detail = await getEventAdminDetail({
            eventId: selectedEventId,
            includeDeletedEvent: includeDeleted,
        });

        if (!detail) {
            return (
                <section className="p-6">
                    <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
                        Event not found. Please return to events list.
                    </div>
                </section>
            );
        }

        return (
            <EventsNewCreate
                includeDeleted={includeDeleted}
                mode="edit"
                eventId={selectedEventId}
                initialData={mapEventDetailToFormData(detail)}
            />
        );
    }

    const events = await listEventAdminSummaries({ includeDeleted });

    const activeEvents = events.filter((e) => !e.deletedAt);
    const archivedCount = events.length - activeEvents.length;

    return (
        <section className="p-6">
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">All Events</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {activeEvents.length} active event{activeEvents.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">


                        <Link
                            href="/admin?section=events&view=create"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            <Plus className="size-3.5" weight="bold" />
                            New Event
                        </Link>
                    </div>
                </div>

                {/* Table-style column headers */}
                {events.length > 0 && (
                    <div className="flex items-center gap-4 border-b border-border/60 px-4 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        <span className="w-[88px] shrink-0 text-center">Status</span>
                        <span className="min-w-0 flex-1">Event</span>
                        <div className="hidden items-center gap-6 md:flex">
                            <span className="w-[72px] text-center">Registrants</span>
                            <span className="w-[72px] text-center">Tickets</span>
                            <span className="w-[80px] text-center">Revenue</span>
                        </div>
                        <span className="w-[72px] shrink-0 text-center">Action</span>
                        <span className="w-4 shrink-0" />
                    </div>
                )}

                {/* Event List */}
                {events.length === 0 ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 p-8 text-center">
                        <CalendarBlank className="mb-3 size-10 text-muted-foreground/40" weight="thin" />
                        <p className="text-sm font-medium text-muted-foreground">No events yet</p>
                        <p className="mt-1 text-xs text-muted-foreground/60">
                            Create your first event to get started
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                        {events.map((event) => (
                            <EventRow
                                key={event.id}
                                event={event}
                                includeDeleted={includeDeleted}
                            />
                        ))}
                    </div>
                )}
            </div>
            {/* Detail Modal */}
            {selectedEventId && (
                <EventsNewDetailModal
                    eventId={selectedEventId}
                    includeDeleted={includeDeleted}
                />
            )}
        </section>
    );
}
