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
import { CalendarBlank, Image, SignOut } from "@phosphor-icons/react/dist/ssr";
import { listSectionMediaState } from "@/lib/media/website-media-service";
import { MediaSectionManager } from "@/components/admin/MediaSectionManager";
import { listWebsiteSectionRules } from "@/lib/media/website-sections";
import { EventsSectionManager } from "@/components/admin/EventsSectionManager";
import { isPaymentStatus, type PaymentStatus } from "@/lib/events/enums";

type AdminSection = "media" | "events";

const navItems: Array<{ title: string; section: AdminSection; icon: typeof Image }> = [
  { title: "Media", section: "media", icon: Image },
  { title: "Events", section: "events", icon: CalendarBlank },
];

function parseSection(value?: string): AdminSection {
  if (value === "events") {
    return "events";
  }
  return "media";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const activeSection = parseSection(typeof params.section === "string" ? params.section : undefined);
  const selectedEventId = typeof params.eventId === "string" ? params.eventId : undefined;
  const includeDeleted = params.includeDeleted === "1";
  const paymentStatus: PaymentStatus | undefined =
    typeof params.paymentStatus === "string" && isPaymentStatus(params.paymentStatus)
      ? params.paymentStatus
      : undefined;

  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  let sectionStates: Array<{
    rule: ReturnType<typeof listWebsiteSectionRules>[number];
    state: Awaited<ReturnType<typeof listSectionMediaState>>;
  }> = [];
  if (activeSection === "media") {
    const sectionRules = listWebsiteSectionRules();
    sectionStates = await Promise.all(
      sectionRules.map(async (rule) => ({
        rule,
        state: await listSectionMediaState({ section: rule.section }),
      })),
    );
  }

  return (
    <SidebarProvider>
      <QueryToasts scope="admin" keys={["success", "info", "error"]} />

      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="px-2 py-3">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-0.5 py-2">
            <div className="flex h-8 w-8 p-0.5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              AW
            </div>
            <div className="truncate group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold text-sidebar-accent-foreground">AWG</p>
              <p className="text-xs text-sidebar-foreground/70">Admin Control</p>
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
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="px-2 pb-3">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 text-sm">
            <p className="truncate font-medium text-sidebar-accent-foreground">{session.email}</p>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-sidebar-foreground/70">
              {session.role}
            </p>
          </div>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              className="mt-2 w-full justify-start border-sidebar-border bg-transparent"
            >
              <SignOut />
              <span>Sign out</span>
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <div>
            <p className="text-sm text-muted-foreground">Section</p>
            <h1 className="text-base font-semibold">
              {activeSection === "events" ? "Events" : "Media"}
            </h1>
          </div>
        </header>

        {activeSection === "events" ? (
          <EventsSectionManager
            selectedEventId={selectedEventId}
            includeDeleted={includeDeleted}
            paymentStatus={paymentStatus}
          />
        ) : (
          <section className="p-4">
            <div className="space-y-4">
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
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
