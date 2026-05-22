import { Card } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/dashboard-stats";
import { cn } from "@/lib/utils";

export function AnalyticsPanel({ stats }: { stats: DashboardStats }) {
  const maxTime = Math.max(
    ...stats.applicationsOverTime.map((d) => d.count),
    1
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-deca-navy">Analytics</h1>
        <p className="mt-1 text-sm text-deca-navy/60">
          Real-time metrics from your Supabase database
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total users", value: stats.totalUsers },
          { label: "Total applications", value: stats.totalApplications },
          { label: "Accepted", value: stats.accepted },
          { label: "Rejected", value: stats.rejected },
        ].map((item) => (
          <Card key={item.label}>
            <p className="text-xs uppercase tracking-wide text-deca-navy/50">
              {item.label}
            </p>
            <p className="mt-1 text-3xl font-bold text-deca-navy">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-semibold text-deca-navy">
          Average score by category
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["Leadership", stats.avgScores.leadership],
              ["Creativity", stats.avgScores.creativity],
              ["Execution", stats.avgScores.execution],
              ["Commitment", stats.avgScores.commitment],
              ["Total", stats.avgScores.total],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl bg-deca-cream px-4 py-3 text-center"
            >
              <p className="text-xs text-deca-navy/50">{label}</p>
              <p className="text-2xl font-bold text-deca-gold-muted">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-deca-navy">
          Applications over time (last 14 days)
        </h2>
        {stats.applicationsOverTime.length === 0 ? (
          <p className="mt-6 text-sm text-deca-navy/50">No application data yet.</p>
        ) : (
          <div className="mt-6 flex items-end gap-2 h-40">
            {stats.applicationsOverTime.map((d) => (
              <div
                key={d.date}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className={cn(
                    "w-full rounded-t bg-deca-navy transition-all",
                    d.count > 0 && "bg-deca-gold"
                  )}
                  style={{
                    height: `${Math.max(8, (d.count / maxTime) * 100)}%`,
                  }}
                  title={`${d.count} on ${d.date}`}
                />
                <span className="text-[10px] text-deca-navy/40 rotate-0 truncate max-w-full">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-deca-navy">Accepted vs rejected</h2>
        <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-deca-navy/10">
          {stats.totalApplications > 0 && (
            <>
              <div
                className="bg-emerald-500"
                style={{
                  width: `${(stats.accepted / stats.totalApplications) * 100}%`,
                }}
              />
              <div
                className="bg-red-400"
                style={{
                  width: `${(stats.rejected / stats.totalApplications) * 100}%`,
                }}
              />
            </>
          )}
        </div>
        <div className="mt-2 flex gap-4 text-xs text-deca-navy/60">
          <span>Accepted: {stats.accepted}</span>
          <span>Rejected: {stats.rejected}</span>
        </div>
      </Card>
    </div>
  );
}
