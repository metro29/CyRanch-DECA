import { ReportsPanel } from "@/components/club/reports-panel";
import { PageShell } from "@/components/layout/page-shell";
import { getOwnProfile, resolveIsAdmin } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Report, ReportWithProfile } from "@/types/database";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/reports");

  const { data: profile } = await getOwnProfile(
    supabase,
    user,
    "role, full_name, email"
  );

  const isAdmin = resolveIsAdmin(profile?.role, user.email);

  let reports: Report[] | ReportWithProfile[] = [];

  if (isAdmin) {
    const { data } = await supabase
      .from("reports")
      .select("*, profiles(email, full_name)")
      .order("created_at", { ascending: false });
    reports = (data ?? []) as ReportWithProfile[];
  } else {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    reports = (data ?? []) as Report[];
  }

  return (
    <PageShell
      title="Reports"
      description={
        isAdmin
          ? "Review submissions from chapter members."
          : "Share feedback, incidents, or suggestions with chapter leadership."
      }
      icon="file"
    >
      <ReportsPanel
        initialReports={reports}
        userId={user.id}
        isAdmin={isAdmin}
      />
    </PageShell>
  );
}
