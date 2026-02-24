import {
    CalendarBlank,
    Ticket,
    CurrencyInr,
    Users,
    ClockCountdown,
    ChartBar,
    CalendarCheck,
    ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard/service";

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return "TBD";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatDateTime(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function KpiCard({
    label,
    value,
    icon: Icon,
    accent,
    subtitle,
}: {
    label: string;
    value: string | number;
    icon: typeof ChartBar;
    accent: string;
    subtitle?: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
                    )}
                </div>
                <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accent}`}
                >
                    <Icon className="size-5 text-white" weight="bold" />
                </div>
            </div>
            {/* Decorative gradient line at bottom */}
            <div
                className={`absolute bottom-0 left-0 h-[2px] w-full ${accent}`}
            />
        </div>
    );
}

function StatusPill({
    label,
    count,
    color,
}: {
    label: string;
    count: number;
    color: string;
}) {
    return (
        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-3.5 py-1.5">
            <span className={`size-2 rounded-full ${color}`} />
            <span className="text-xs font-medium text-foreground">{label}</span>
            <span className="text-xs font-bold text-foreground">{count}</span>
        </div>
    );
}

export async function DashboardSectionManager() {
    const data = await getDashboardData();

    const currentDate = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <section className="p-6">
            <div className="space-y-8">
                {/* Welcome Header */}
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Welcome Back! 👋
                    </h2>
                    <p className="text-sm text-muted-foreground">{currentDate}</p>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <KpiCard
                        label="Total Events"
                        value={data.events.total}
                        icon={CalendarBlank}
                        accent="bg-blue-500"
                        subtitle={`${data.events.published} published · ${data.events.draft} drafts`}
                    />
                    <KpiCard
                        label="Total Registrations"
                        value={data.registrations.total}
                        icon={Ticket}
                        accent="bg-violet-500"
                        subtitle={`${data.registrations.paid} paid · ${data.registrations.pending} pending`}
                    />
                    <KpiCard
                        label="Gross Revenue"
                        value={formatCurrency(data.revenue.gross)}
                        icon={CurrencyInr}
                        accent="bg-emerald-500"
                        subtitle="From paid registrations"
                    />
                    <KpiCard
                        label="Tickets Sold"
                        value={data.tickets.totalSold}
                        icon={ChartBar}
                        accent="bg-orange-500"
                        subtitle="Across all events"
                    />
                    <KpiCard
                        label="Total Users"
                        value={data.users.total}
                        icon={Users}
                        accent="bg-pink-500"
                        subtitle="Registered accounts"
                    />
                    <KpiCard
                        label="Pending Payments"
                        value={data.registrations.pending}
                        icon={ClockCountdown}
                        accent="bg-amber-500"
                        subtitle={`${data.registrations.failed} failed`}
                    />
                </div>

                {/* Event Status Breakdown */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground/80">
                        Event Status Overview
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <StatusPill
                            label="Published"
                            count={data.events.published}
                            color="bg-emerald-500"
                        />
                        <StatusPill
                            label="Draft"
                            count={data.events.draft}
                            color="bg-amber-500"
                        />
                        <StatusPill
                            label="Completed"
                            count={data.events.completed}
                            color="bg-blue-500"
                        />
                        <StatusPill
                            label="Cancelled"
                            count={data.events.cancelled}
                            color="bg-red-500"
                        />
                    </div>
                </div>

                {/* Two-column layout for tables */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Upcoming Events */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarCheck
                                    className="size-4 text-muted-foreground"
                                    weight="bold"
                                />
                                <h3 className="text-sm font-semibold text-foreground/80">
                                    Upcoming Events
                                </h3>
                            </div>
                            <Link
                                href="/admin?section=events"
                                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                View all
                                <ArrowRight className="size-3" />
                            </Link>
                        </div>
                        {data.upcomingEvents.length === 0 ? (
                            <div className="rounded-lg border border-border/50 bg-muted/10 p-8 text-center">
                                <CalendarBlank className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                                <p className="text-sm text-muted-foreground italic">
                                    No upcoming events
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-lg border border-border/50">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/30 font-medium text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2.5">Event</th>
                                            <th className="px-3 py-2.5">Date</th>
                                            <th className="px-3 py-2.5">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30 bg-card">
                                        {data.upcomingEvents.map((event) => (
                                            <tr key={event.id} className="transition-colors hover:bg-muted/20">
                                                <td className="px-3 py-2.5 font-medium text-foreground max-w-[180px] truncate">
                                                    <Link
                                                        href={`/admin?section=events&eventId=${event.id}`}
                                                        className="hover:text-primary transition-colors"
                                                    >
                                                        {event.name}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                                                    {formatDate(event.eventDate)}
                                                </td>
                                                <td className="px-3 py-2.5 text-muted-foreground">
                                                    {[event.city, event.state]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Recent Bookings */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Ticket
                                    className="size-4 text-muted-foreground"
                                    weight="bold"
                                />
                                <h3 className="text-sm font-semibold text-foreground/80">
                                    Recent Bookings
                                </h3>
                            </div>
                            <Link
                                href="/admin?section=bookings"
                                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                View all
                                <ArrowRight className="size-3" />
                            </Link>
                        </div>
                        {data.recentBookings.length === 0 ? (
                            <div className="rounded-lg border border-border/50 bg-muted/10 p-8 text-center">
                                <Ticket className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                                <p className="text-sm text-muted-foreground italic">
                                    No bookings yet
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-lg border border-border/50">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/30 font-medium text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2.5">Name</th>
                                            <th className="px-3 py-2.5">Event</th>
                                            <th className="px-3 py-2.5 text-right">Amount</th>
                                            <th className="px-3 py-2.5">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30 bg-card">
                                        {data.recentBookings.map((booking) => (
                                            <tr
                                                key={booking.id}
                                                className="transition-colors hover:bg-muted/20"
                                            >
                                                <td className="px-3 py-2.5 font-medium text-foreground max-w-[120px] truncate">
                                                    {booking.name}
                                                </td>
                                                <td className="px-3 py-2.5 text-muted-foreground max-w-[140px] truncate">
                                                    {booking.eventName}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-medium text-emerald-500 whitespace-nowrap">
                                                    {formatCurrency(booking.finalAmount)}
                                                </td>
                                                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                                                    {formatDateTime(booking.createdAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
