import { Card } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/dashboard-stats";
import { STATUS_LABELS } from "@/types/database";
import { ArrowRight, FileText, Users } from "lucide-react";
import Link from "next/link";

export function OverviewPanel({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: "Total users", value: stats.totalUsers, href: "/dashboard/users", icon: Users },
    {
      label: "Applications",
      value: stats.totalApplications,
      href: "/dashboard/applications",
      icon: FileText,
    },
    { label: "Accepted", value: stats.accepted, href: "/dashboard/applications" },
    { label: "Under review", value: stats.byStatus.under_review, href: "/dashboard/applications" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-deca-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-deca-navy/60">
          Platform overview — all metrics from Supabase
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="card-hover group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-deca-navy/50">
                    {c.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-deca-navy">{c.value}</p>
                </div>
                {c.icon && (
                  <c.icon className="h-8 w-8 text-deca-gold/40 group-hover:text-deca-gold" />
                )}
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs font-medium text-deca-gold-muted">
                View <ArrowRight className="h-3 w-3" />
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-deca-navy">Application pipeline</h2>
          <ul className="mt-4 space-y-2">
            {(
              Object.entries(stats.byStatus) as [keyof typeof stats.byStatus, number][]
            ).map(([status, count]) => (
              <li
                key={status}
                className="flex justify-between text-sm"
              >
                <span className="text-deca-navy/70">
                  {STATUS_LABELS[status]}
                </span>
                <span className="font-medium text-deca-navy">{count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold text-deca-navy">User accounts</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-deca-navy/70">Active</span>
              <span className="font-medium">{stats.activeUsers}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-deca-navy/70">Suspended</span>
              <span className="font-medium">{stats.suspendedUsers}</span>
            </li>
          </ul>
          <Link
            href="/dashboard/users"
            className="mt-4 inline-flex text-sm font-medium text-deca-gold-muted hover:underline"
          >
            Manage users →
          </Link>
        </Card>
      </div>
    </div>
  );
}
