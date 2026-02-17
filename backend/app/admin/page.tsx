import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth/session";
import { logoutAction } from "@/app/(auth)/actions";
import { QueryToasts } from "@/components/providers/QueryToasts";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CalendarBlank, CalendarPlus, Image, SignOut, CaretRight, Slideshow, Users, Star, Briefcase, BookOpen, ChartLineUp, GearSix } from "@phosphor-icons/react/dist/ssr";
import { listSectionMediaState } from "@/lib/media/website-media-service";
import { MediaSectionManager } from "@/components/admin/MediaSectionManager";
import { listWebsiteSectionRules } from "@/lib/media/website-sections";
import { EventsNewSectionManager } from "@/components/admin/EventsNewSectionManager";
import { LeadsSectionManager } from "@/components/admin/LeadsSectionManager";
import { BookingsSectionManager } from "@/components/admin/BookingsSectionManager";
import { listAllUsers, type LeadUser } from "@/lib/leads/service";

type AdminSection = "media" | "events" | "leads" | "bookings";
type MediaCategory = "highlights" | "hero-carousel" | "members";

const navItems: Array<{ title: string; section: AdminSection; icon: typeof Image; enabled: boolean }> = [
  { title: "Media", section: "media", icon: Image, enabled: true },
  { title: "Events", section: "events", icon: CalendarPlus, enabled: true },
  { title: "Bookings", section: "bookings", icon: BookOpen, enabled: true },
  { title: "Events (Legacy)", section: "media", icon: CalendarBlank, enabled: false },
  { title: "Work", section: "media", icon: Briefcase, enabled: false },
  { title: "Publications", section: "media", icon: BookOpen, enabled: false },
  { title: "Leads", section: "leads", icon: ChartLineUp, enabled: true },
  { title: "Settings", section: "media", icon: GearSix, enabled: false },
];

const mediaCategories: Array<{
  id: MediaCategory;
  label: string;
  description: string;
  icon: typeof Star;
  enabled: boolean;
}> = [
    { id: "highlights", label: "Highlights", description: "Showcase images on the homepage", icon: Star, enabled: true },
    { id: "hero-carousel", label: "Hero Carousel", description: "Background images for the hero section", icon: Slideshow, enabled: true },
    { id: "members", label: "Members", description: "Team and member photos", icon: Users, enabled: true },
  ];

function parseSection(value?: string): AdminSection {
  if (value === "events") return "events";
  if (value === "leads") return "leads";
  if (value === "bookings") return "bookings";
  return "media";
}

function parseMediaCategory(value?: string): MediaCategory | null {
  if (value === "highlights" || value === "hero-carousel" || value === "members") {
    return value;
  }
  return null;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const activeSection = parseSection(typeof params.section === "string" ? params.section : undefined);
  const mediaCategory = parseMediaCategory(typeof params.mediaCategory === "string" ? params.mediaCategory : undefined);
  const selectedEventId = typeof params.eventId === "string" ? params.eventId : undefined;
  const includeDeleted = params.includeDeleted === "1";
  const view = typeof params.view === "string" ? params.view : undefined;

  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  let sectionStates: Array<{
    rule: ReturnType<typeof listWebsiteSectionRules>[number];
    state: Awaited<ReturnType<typeof listSectionMediaState>>;
  }> = [];
  if (activeSection === "media" && mediaCategory) {
    const sectionRules = listWebsiteSectionRules().filter(r => r.section === mediaCategory);
    sectionStates = await Promise.all(
      sectionRules.map(async (rule) => ({
        rule,
        state: await listSectionMediaState({ section: rule.section }),
      })),
    );
  }

  let leadUsers: LeadUser[] = [];
  if (activeSection === "leads") {
    leadUsers = await listAllUsers();
  }

  return (
    <SidebarProvider>
      <QueryToasts scope="admin" keys={["success", "info", "error"]} />

      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="px-2 py-3">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-sm font-bold tracking-tight text-white shadow-md ring-1 ring-black/5">
              A
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate font-[family-name:var(--font-instrument-serif)] text-lg font-semibold text-sidebar-accent-foreground">
                akar
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.15em] text-sidebar-foreground/50">
                Admin Control
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.enabled ? (
                      <SidebarMenuButton
                        asChild
                        isActive={activeSection === item.section}
                        tooltip={item.title}
                      >
                        <Link href={`/admin?section=${item.section}`}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        disabled
                        tooltip={`${item.title} (Coming soon)`}
                        className="pointer-events-none opacity-40"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="px-2 pb-3">
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              className="w-full justify-start overflow-hidden border-sidebar-border bg-transparent group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
            >
              <SignOut className="shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-1.5 text-sm">
            {activeSection === "events" ? (
              <h1 className="font-semibold">Events</h1>
            ) : activeSection === "leads" ? (
              <h1 className="font-semibold">Leads</h1>
            ) : activeSection === "bookings" ? (
              <h1 className="font-semibold">Bookings</h1>
            ) : mediaCategory ? (
              <>
                <Link href="/admin?section=media" className="text-muted-foreground hover:text-foreground">
                  Media
                </Link>
                <CaretRight className="size-3 text-muted-foreground/60" />
                <h1 className="font-semibold capitalize">{mediaCategory.replace("-", " ")}</h1>
              </>
            ) : (
              <h1 className="font-semibold">Media</h1>
            )}
          </div>
        </header>

        {activeSection === "events" ? (
          <EventsNewSectionManager
            includeDeleted={includeDeleted}
            selectedEventId={selectedEventId}
            view={view}
          />
        ) : activeSection === "leads" ? (
          <section className="p-6">
            <LeadsSectionManager users={leadUsers} />
          </section>
        ) : activeSection === "bookings" ? (
          <section className="p-6">
            <BookingsSectionManager />
          </section>
        ) : mediaCategory ? (
          <section className="p-6">
            <div className="space-y-8">
              {sectionStates.map(({ rule, state }) => (
                <MediaSectionManager
                  key={rule.section}
                  title={rule.label}
                  description={`Manage images for ${rule.label.toLowerCase()} section`}
                  section={state}
                />
              ))}
            </div>
          </section>
        ) : (
          /* Media category picker */
          <section className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">Media Sections</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a category to manage its images
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mediaCategories.map((cat) => {
                const Icon = cat.icon;
                return cat.enabled ? (
                  <Link
                    key={cat.id}
                    href={`/admin?section=media&mediaCategory=${cat.id}`}
                    className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-muted/50"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-foreground/5">
                      <Icon className="size-5 text-foreground" weight="duotone" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <CaretRight className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/60" />
                  </Link>
                ) : (
                  <div
                    key={cat.id}
                    className="flex cursor-not-allowed items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-5 opacity-50"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-foreground/5">
                      <Icon className="size-5 text-muted-foreground" weight="duotone" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-muted-foreground">{cat.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Soon
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
