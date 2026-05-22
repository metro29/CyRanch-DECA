import { CalendarPanel } from "@/components/club/calendar-panel";
import { PageShell } from "@/components/layout/page-shell";
import { getOwnProfile, resolveIsAdmin } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/types/database";
export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await getOwnProfile(supabase, user, "role");
    isAdmin = resolveIsAdmin(profile?.role, user.email);
  }

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .order("starts_at", { ascending: true });

  return (
    <PageShell
      title="Calendar"
      description="Chapter meetings, competitions, and important dates."
      icon="calendar"
    >
      <CalendarPanel
        initialEvents={(events ?? []) as CalendarEvent[]}
        isAdmin={isAdmin}
        userId={user?.id ?? null}
      />
    </PageShell>
  );
}
