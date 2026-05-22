import { ApplicationsPanel } from "@/components/dashboard/admin-dashboard";
import { normalizeApplicationRow } from "@/lib/applications";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardApplicationsPage() {
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      `
      *,
      profiles (email, full_name, grade),
      scores (*)
    `
    )
    .order("created_at", { ascending: false });

  const normalized = (applications ?? []).map((row) =>
    normalizeApplicationRow(row as Record<string, unknown>)
  );

  return <ApplicationsPanel applications={normalized} />;
}
