import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DashboardData = {
  events: {
    total: number;
    published: number;
    draft: number;
    completed: number;
    cancelled: number;
  };
  registrations: {
    total: number;
    paid: number;
    pending: number;
    failed: number;
  };
  revenue: {
    gross: number;
  };
  users: {
    total: number;
  };
  tickets: {
    totalSold: number;
  };
  upcomingEvents: Array<{
    id: string;
    name: string;
    eventDate: string | null;
    city: string;
    state: string;
    status: string;
  }>;
  recentBookings: Array<{
    id: string;
    name: string;
    eventName: string;
    finalAmount: number;
    paymentStatus: string;
    createdAt: string;
  }>;
};

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createSupabaseAdminClient();

  const [
    eventsResult,
    registrationsResult,
    ticketsResult,
    usersResult,
    upcomingEventsResult,
    recentBookingsResult,
  ] = await Promise.all([
    // All events (non-deleted)
    supabase.from("events").select("id,status").is("deleted_at", null),

    // All registrations
    supabase
      .from("event_registrations")
      .select("id,payment_status,final_amount")
      .is("deleted_at", null),

    // All tickets (for sold count)
    supabase
      .from("event_tickets")
      .select("id,sold_count")
      .is("deleted_at", null),

    // User count
    supabase.from("users").select("id", { count: "exact", head: true }),

    // Upcoming events (event_date >= today)
    supabase
      .from("events")
      .select("id,name,event_date,city,state,status")
      .is("deleted_at", null)
      .eq("status", "published")
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true })
      .limit(5),

    // Recent paid bookings with event name
    supabase
      .from("event_registrations")
      .select("id,name,final_amount,payment_status,created_at,event_id")
      .is("deleted_at", null)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Process events breakdown
  const events = eventsResult.data || [];
  const eventStats = {
    total: events.length,
    published: events.filter((e) => e.status === "published").length,
    draft: events.filter((e) => e.status === "draft").length,
    completed: events.filter((e) => e.status === "completed").length,
    cancelled: events.filter((e) => e.status === "cancelled").length,
  };

  // Process registrations
  const registrations = registrationsResult.data || [];
  const registrationStats = {
    total: registrations.length,
    paid: registrations.filter((r) => r.payment_status === "paid").length,
    pending: registrations.filter((r) => r.payment_status === "pending").length,
    failed: registrations.filter((r) => r.payment_status === "failed").length,
  };

  // Gross revenue (from paid registrations)
  const grossRevenue = registrations
    .filter((r) => r.payment_status === "paid")
    .reduce((acc, r) => acc + toNumber(r.final_amount), 0);

  // Tickets sold
  const tickets = ticketsResult.data || [];
  const totalTicketsSold = tickets.reduce(
    (acc, t) => acc + (t.sold_count || 0),
    0,
  );

  // Get event names for recent bookings
  const recentBookingsRaw = recentBookingsResult.data || [];
  const eventIds = [...new Set(recentBookingsRaw.map((b) => b.event_id))];

  let eventNameMap = new Map<string, string>();
  if (eventIds.length > 0) {
    const { data: eventNames } = await supabase
      .from("events")
      .select("id,name")
      .in("id", eventIds);
    (eventNames || []).forEach((e) => {
      eventNameMap.set(e.id, e.name);
    });
  }

  const recentBookings = recentBookingsRaw.map((b) => ({
    id: b.id,
    name: b.name || "—",
    eventName: eventNameMap.get(b.event_id) || "Unknown Event",
    finalAmount: toNumber(b.final_amount),
    paymentStatus: b.payment_status,
    createdAt: b.created_at,
  }));

  const upcomingEvents = (upcomingEventsResult.data || []).map((e) => ({
    id: e.id,
    name: e.name,
    eventDate: e.event_date,
    city: e.city,
    state: e.state,
    status: e.status,
  }));

  return {
    events: eventStats,
    registrations: registrationStats,
    revenue: { gross: grossRevenue },
    users: { total: usersResult.count || 0 },
    tickets: { totalSold: totalTicketsSold },
    upcomingEvents,
    recentBookings,
  };
}
