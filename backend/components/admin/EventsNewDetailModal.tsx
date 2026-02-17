import Link from "next/link";
import {
    X,
    CalendarBlank,
    MapPin,
    Ticket,
    Tag,
    ListBullets,
    ChartBar,
    Globe,
    Clock,
    ShieldCheck,
    Archive,
    XCircle,
    CheckCircle,
    ArrowLeft,
    PencilSimple,
} from "@phosphor-icons/react/dist/ssr";
import { getEventAdminDetail, type EventDetail } from "@/lib/events/service";
import { EventStatusButton } from "./EventStatusButton";
import { cancelEventAction, publishEventAction, moveToDraftAction } from "@/app/admin/events-new-actions";

// Helper for formatting currency
function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

// Helper for formatting date
function formatDate(dateStr: string | null) {
    if (!dateStr) return "TBD";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function formatVisibilityConfig(config: any) {
    if (!config || Object.keys(config).length === 0) return "—";
    return Object.entries(config)
        .map(([key, values]) => {
            const valArray = Array.isArray(values) ? values : [values];
            return `${key}: ${valArray.join(", ")}`;
        })
        .join("; ");
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <Icon className="size-4 text-muted-foreground" weight="bold" />
                <h4 className="text-sm font-semibold text-foreground/80">{title}</h4>
            </div>
            <div className="px-1">{children}</div>
        </div>
    );
}

// Helper to safely map colspan to valid Tailwind classes
function getColSpanClass(span?: number) {
    switch (span) {
        case 2: return "col-span-2";
        case 3: return "col-span-3";
        case 4: return "col-span-4";
        default: return ""; // col-span-1 is implied by grid structure usually, or explicit col-span-1
    }
}

function KeyValueGrid({ items }: { items: { label: string; value: React.ReactNode; colSpan?: number }[] }) {
    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
            {items.map((item, i) => (
                <div key={i} className={getColSpanClass(item.colSpan)}>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                        {item.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">{item.value || "—"}</dd>
                </div>
            ))}
        </div>
    );
}

export async function EventsNewDetailModal({
    eventId,
    includeDeleted,
}: {
    eventId: string;
    includeDeleted: boolean;
}) {

    let data: EventDetail | null = null;
    try {
        data = await getEventAdminDetail({ eventId, includeDeletedEvent: includeDeleted });
    } catch (error) {
        // If error, likely id invalid or permission denied
    }

    const backLink = `/admin?section=events${includeDeleted ? "&includeDeleted=1" : ""}`;

    if (!data) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="w-full max-w-sm rounded-xl bg-card p-6 text-center shadow-xl">
                    <p className="font-semibold text-red-500">Event not found</p>
                    <Link
                        href={backLink}
                        className="mt-4 inline-block rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80"
                    >
                        Close
                    </Link>
                </div>
            </div>
        );
    }

    const { event, tickets, coupons, formFields, bundleOffers, analytics } = data;
    const includeDeletedQuery = includeDeleted ? "&includeDeleted=1" : "";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8">
            {/* Click outside to close (link covering full screen behind modal) */}
            <Link href={backLink} className="absolute inset-0 cursor-default" aria-label="Close modal" />

            <div className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border/50">
                {/* Header */}
                <div className="flex shrink-0 items-start justify-between border-b border-border/40 bg-muted/20 px-6 py-5">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-foreground">{event.name}</h2>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-[10px] text-muted-foreground uppercase">{event.id}</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            <span className={`font-semibold uppercase ${event.status === 'published' ? 'text-emerald-500' : event.status === 'draft' ? 'text-amber-500' : event.status === 'cancelled' ? 'text-red-500' : 'text-blue-500'}`}>
                                {event.status}
                            </span>
                            {event.verification_required && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                    <span className="flex items-center gap-1 font-medium text-violet-500">
                                        <ShieldCheck weight="fill" /> Verified
                                    </span>
                                </>
                            )}
                            {event.deleted_at && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                    <span className="flex items-center gap-1 font-medium text-neutral-500">
                                        <Archive weight="fill" /> Archived
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        {!event.deleted_at && (
                            <div className="mt-2 flex items-center gap-3">
                                <Link
                                    href={`/admin?section=events&view=edit&eventId=${event.id}${includeDeletedQuery}`}
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
                                    title="Edit event"
                                >
                                    <PencilSimple className="size-3.5" weight="bold" />
                                    Edit
                                </Link>
                                {event.status === "draft" && (
                                    <EventStatusButton
                                        eventId={event.id}
                                        eventName={event.name}
                                        includeDeleted={includeDeleted}
                                        action={publishEventAction}
                                        title="Publish Event?"
                                        description="Are you sure you want to publish {eventName}? This will make it visible to users."
                                        confirmLabel="Yes, Publish Event"
                                        variant="constructive"
                                        trigger={
                                            <button
                                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
                                                title="Publish event"
                                            >
                                                <CheckCircle className="size-3.5" weight="bold" />
                                                Publish
                                            </button>
                                        }
                                    />
                                )}

                                {event.status === "published" && (
                                    <>
                                        <EventStatusButton
                                            eventId={event.id}
                                            eventName={event.name}
                                            includeDeleted={includeDeleted}
                                            action={moveToDraftAction}
                                            title="Move to Draft?"
                                            description="Are you sure you want to move {eventName} back to draft? It will no longer be visible to users."
                                            confirmLabel="Yes, Move to Draft"
                                            variant="constructive"
                                            trigger={
                                                <button
                                                    className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400 transition-colors hover:bg-amber-500/20 hover:text-amber-300"
                                                    title="Move to draft"
                                                >
                                                    <Archive className="size-3.5" weight="bold" />
                                                    Move to Draft
                                                </button>
                                            }
                                        />
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
                                                    className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                                                    title="Cancel event"
                                                >
                                                    <XCircle className="size-3.5" weight="bold" />
                                                    Cancel
                                                </button>
                                            }
                                        />
                                    </>
                                )}

                                {event.status === "cancelled" && (
                                    <EventStatusButton
                                        eventId={event.id}
                                        eventName={event.name}
                                        includeDeleted={includeDeleted}
                                        action={publishEventAction}
                                        title="Re-publish Event?"
                                        description="Are you sure you want to re-publish {eventName}? "
                                        confirmLabel="Yes, Publish Event"
                                        variant="constructive"
                                        trigger={
                                            <button
                                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
                                                title="Publish event"
                                            >
                                                <CheckCircle className="size-3.5" weight="bold" />
                                                Publish
                                            </button>
                                        }
                                    />
                                )}
                            </div>
                        )}
                    </div>
                    <Link
                        href={backLink}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-5" weight="bold" />
                    </Link>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
                    <div className="grid gap-8 pb-8">

                        {/* Overview Section - Custom Layout for Segregation */}
                        <Section title="Overview" icon={Globe}>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 sm:gap-4">
                                {/* Date */}
                                <div className="col-span-1">
                                    <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Date</dt>
                                    <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                        <CalendarBlank className="size-3.5 text-muted-foreground" />
                                        {formatDate(event.event_date)}
                                    </dd>
                                </div>

                                {/* Location (City, State) */}
                                <div className="col-span-1">
                                    <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Location</dt>
                                    <dd className="mt-1 flex items-start gap-1.5">
                                        <MapPin className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                        <span className="text-sm font-medium text-foreground">
                                            {[event.city, event.state].filter(Boolean).join(", ")}
                                        </span>
                                    </dd>
                                </div>

                                {/* Address (Separate Line/Division) */}
                                <div className="col-span-1">
                                    <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Address</dt>
                                    <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                                        {event.address_line_1 ? <p>{event.address_line_1}</p> : null}
                                        {event.address_line_2 ? <p>{event.address_line_2}</p> : null}
                                    </div>
                                </div>

                                {/* Country */}
                                <div className="col-span-1">
                                    <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Country</dt>
                                    <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                        <Globe className="size-3.5 text-muted-foreground" />
                                        {event.country}
                                    </dd>
                                </div>
                            </div>
                            {event.location_url && (
                                <div className="mt-4 pt-4 border-t border-border/40">
                                    <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-1.5">Google Maps Link</dt>
                                    <a
                                        href={event.location_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group"
                                    >
                                        <MapPin className="size-3.5" weight="bold" />
                                        <span>View on Google Maps</span>
                                        <ArrowLeft className="size-3.5 rotate-180 group-hover:translate-x-0.5 transition-transform" weight="bold" />
                                    </a>
                                </div>
                            )}

                            {/* About & T&C (Text view) */}
                            <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                                <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                                    <h5 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">About</h5>
                                    <div className="max-h-32 overflow-y-auto whitespace-pre-wrap text-xs text-foreground/80 scrollbar-thin scrollbar-thumb-muted">
                                        {event.about || "No description"}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                                    <h5 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">Terms</h5>
                                    <div className="max-h-32 overflow-y-auto whitespace-pre-wrap text-xs text-foreground/80 scrollbar-thin scrollbar-thumb-muted">
                                        {event.terms_and_conditions || "No terms"}
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* Registration Settings */}
                        <Section title="Registration" icon={Clock}>
                            <KeyValueGrid
                                items={[
                                    { label: "Starts", value: formatDate(event.registration_start) },
                                    { label: "Ends", value: formatDate(event.registration_end) },
                                    { label: "Starts", value: formatDate(event.registration_start) },
                                    { label: "Ends", value: formatDate(event.registration_end) },
                                ]}
                            />
                        </Section>

                        {/* Tiers / Activities */}
                        <Section title="Tiers / Activities" icon={Ticket}>
                            {tickets.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No Active Tickets</p>
                            ) : (
                                <div className="overflow-hidden rounded-lg border border-border/50">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/30 font-medium text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2">Price</th>
                                                <th className="px-3 py-2 text-center">Qty (Sold/Total)</th>
                                                <th className="px-3 py-2 text-center">Max/Person</th>
                                                <th className="px-3 py-2">Status</th>
                                                <th className="px-3 py-2">Condition</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30 bg-card">
                                            {tickets.map((t) => (
                                                <tr key={t.id}>
                                                    <td className="px-3 py-2 font-medium">{formatCurrency(t.price)}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        {t.soldCount} / {t.quantity ?? "∞"}
                                                    </td>
                                                    <td className="px-3 py-2 text-center font-medium">
                                                        {t.maxQuantityPerPerson}
                                                    </td>
                                                    <td className="px-3 py-2 capitalize text-muted-foreground">{t.status}</td>
                                                    <td className="px-3 py-2 text-muted-foreground text-xs">
                                                        {formatVisibilityConfig(t.visibilityConfig)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Section>

                        {/* Coupons */}
                        <Section title="Coupons" icon={Tag}>
                            {coupons.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No Coupons</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {coupons.map(c => (
                                        <div key={c.id} className="rounded-md border border-border/60 bg-muted/10 px-3 py-1.5 text-xs">
                                            <span className="font-mono font-semibold text-primary">{c.code}</span>
                                            <span className="mx-2 text-muted-foreground">
                                                {formatCurrency(c.discountValue)} OFF
                                            </span>

                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* Bundle Offers */}
                        {bundleOffers && bundleOffers.length > 0 && (
                            <Section title="Bundle Offers" icon={Tag}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {bundleOffers.map((offer) => (
                                        <div key={offer.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h5 className="font-bold text-sm tracking-tight">{offer.name}</h5>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${offer.offerType === 'same_tier'
                                                    ? 'bg-blue-50 border-blue-100 text-blue-700'
                                                    : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                                    }`}>
                                                    {offer.offerType === 'same_tier' ? 'Same Tier' : 'Cross Tier'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mb-4 bg-emerald-50 border border-emerald-100 p-3 rounded-md">
                                                <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                                    <Tag size={16} weight="bold" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-emerald-800">Buy {offer.buyQuantity} Get {offer.getQuantity} FREE</p>
                                                    <p className="text-[10px] text-emerald-600/80 tracking-wide font-medium">Limited time bundle offer</p>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Valid On</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {!offer.applicableTicketIds || offer.applicableTicketIds.length === 0 ? (
                                                        <span className="text-xs text-muted-foreground italic bg-muted/30 px-2 py-0.5 rounded">All Event Tiers / Activities</span>
                                                    ) : (
                                                        offer.applicableTicketIds.map((id) => {
                                                            const ticket = tickets.find(t => t.id === id);
                                                            return (
                                                                <span key={id} className="text-[10px] font-semibold bg-secondary/50 border border-secondary text-secondary-foreground px-2 py-0.5 rounded shadow-sm">
                                                                    {(ticket?.description as any)?.name || id}
                                                                </span>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* Form Fields */}
                        <Section title="Form Fields" icon={ListBullets}>
                            {formFields.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">Default Fields Only</p>
                            ) : (
                                <div className="overflow-hidden rounded-lg border border-border/50">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/30 font-medium text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2 w-8 text-center">#</th>
                                                <th className="px-3 py-2">Label</th>
                                                <th className="px-3 py-2">Type</th>
                                                <th className="px-3 py-2">Options</th>
                                                <th className="px-3 py-2 text-center">Required</th>
                                                <th className="px-3 py-2 text-center">Hidden</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30 bg-card">
                                            {formFields.map((f, i) => (
                                                <tr key={f.id}>
                                                    <td className="px-3 py-2 text-center text-muted-foreground font-mono">{i + 1}</td>
                                                    <td className="px-3 py-2 font-medium">{f.label}</td>
                                                    <td className="px-3 py-2">
                                                        <span className="rounded border border-border/50 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] uppercase text-foreground/70">
                                                            {f.fieldType}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px]" title={f.options ? JSON.stringify(f.options) : ""}>
                                                        {f.options && Array.isArray(f.options)
                                                            ? f.options.map(o => {
                                                                if (typeof o === 'object') {
                                                                    const label = (o as any).label || (o as any).value;
                                                                    const triggers = (o as any).triggers;
                                                                    return triggers && triggers.length > 0 ? `${label} (→ ${triggers.join(", ")})` : label;
                                                                }
                                                                return o;
                                                            }).join(", ")
                                                            : f.options ? JSON.stringify(f.options) : "—"}
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-xs">
                                                        {f.isRequired ? (
                                                            <span className="font-semibold text-red-500">Yes</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">No</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-xs">
                                                        {f.isHidden ? (
                                                            <span className="font-semibold text-amber-500">Yes</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">No</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Section>

                        {/* Analytics */}
                        <Section title="Analytics" icon={ChartBar}>
                            <KeyValueGrid
                                items={[
                                    { label: "Gross Revenue", value: <span className="text-emerald-500 font-semibold">{formatCurrency(analytics.totalRevenue)}</span> },
                                    { label: "Paid Registrations", value: analytics.paidRegistrations },
                                    { label: "Pending Payment", value: analytics.pendingRegistrations },
                                    { label: "Tickets Sold", value: analytics.totalQuantity },
                                ]}
                            />
                        </Section>

                    </div>
                </div>
            </div>
        </div>
    );
}
