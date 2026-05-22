import { ApplicationWindowControl } from "@/components/admin/application-window-control";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { buildStatsFromRows } from "@/lib/dashboard-stats";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: applications }, { data: scores }, settings] =
    await Promise.all([
      supabase.from("profiles").select("status"),
      supabase.from("applications").select("status, created_at, submitted_at"),
      supabase.from("scores").select(
        "leadership, creativity, execution, commitment, total_score"
      ),
      getAppSettings(supabase),
    ]);

  const stats = buildStatsFromRows(
    profiles ?? [],
    applications ?? [],
    scores ?? []
  );

  return (
    <div className="space-y-8">
      <ApplicationWindowControl settings={settings} />
      <OverviewPanel stats={stats} />
    </div>
  );
}
