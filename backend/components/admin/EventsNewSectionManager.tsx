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
    XCircle,
    CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import { listEventAdminSummaries, type EventSummary } from "@/lib/events/service";
import { cancelEventAction, publishEventAction } from "@/app/admin/events-new-actions";
import { EventStatusButton } from "@/components/admin/EventStatusButton";
import { EventsNewDetailModal } from "./EventsNewDetailModal";

type EventsNewSectionManagerProps = {
    includeDeleted?: boolean;
    selectedEventId?: string;
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

function EventRow({ event, includeDeleted }: { event: EventSummary; includeDeleted: boolean }) {
    const isArchived = !!event.deletedAt;
    const isCancelled = event.status === "cancelled";
    const includeDeletedQuery = includeDeleted ? "&includeDeleted=1" : "";

    return (
        <div
            className={`group flex items-center gap-4 border-b border-border/40 px-4 py-3.5 transition-colors hover:bg-muted/40 ${isArchived ? "opacity-50" : ""
                }`}
        >
            {/* Status badge */}
            <span
                className={`inline-flex w-[88px] shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${statusColor(event.status)}`}
            >
                {event.status}
            </span>

            {/* Name + Location + Date — clickable */}
            <Link
                href={`/admin?section=events-new&eventId=${event.id}${includeDeletedQuery}`}
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

            {/* Cancel button */}
            {/* Actions */}
            {!isArchived ? (
                isCancelled ? (
                    <EventStatusButton
                        eventId={event.id}
                        eventName={event.name}
                        includeDeleted={includeDeleted}
                        action={publishEventAction}
                        title="Publish Event?"
                        description="Are you sure you want to publish {eventName}? "
                        confirmLabel="Yes, Publish Event"
                        variant="constructive"
                        trigger={
                            <button
                                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
                                title="Publish event"
                            >
                                <CheckCircle className="size-3.5" weight="bold" />
                                Publish
                            </button>
                        }
                    />
                ) : (
                    <EventStatusButton
                        eventId={event.id}
                        eventName={event.name}
                        includeDeleted={includeDeleted}
                        action={cancelEventAction}
                        title="Cancel Event?"
                        description="Are you sure you want to cancel {eventName}? This will set the event status to cancelled."
                        confirmLabel="Yes, Cancel Event"
                        variant="destructive"
                        trigger={
                            <button
                                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                                title="Cancel event"
                            >
                                <XCircle className="size-3.5" weight="bold" />
                                Cancel
                            </button>
                        }
                    />
                )
            ) : (
                <span className="w-[72px] shrink-0" />
            )}

            {/* Arrow */}
            <Link
                href={`/admin?section=events-new&eventId=${event.id}${includeDeletedQuery}`}
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
}: EventsNewSectionManagerProps) {
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
                            {archivedCount > 0 && (
                                <span className="text-muted-foreground/60">
                                    {" "}· {archivedCount} archived
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/admin?section=events-new${includeDeleted ? "" : "&includeDeleted=1"}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                        >
                            {includeDeleted ? (
                                <>
                                    <EyeSlash className="size-3.5" weight="bold" />
                                    Hide archived
                                </>
                            ) : (
                                <>
                                    <Eye className="size-3.5" weight="bold" />
                                    Show archived
                                </>
                            )}
                        </Link>

                        <Link
                            href="/admin?section=events-new&view=create"
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
