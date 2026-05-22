import type { ApplicationStatus } from "@/types/database";

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalApplications: number;
  byStatus: Record<ApplicationStatus, number>;
  accepted: number;
  rejected: number;
  avgScores: {
    leadership: number;
    creativity: number;
    execution: number;
    commitment: number;
    total: number;
  };
  applicationsOverTime: { date: string; count: number }[];
}

export function buildStatsFromRows(
  profiles: { status: string }[],
  applications: {
    status: ApplicationStatus;
    created_at: string;
    submitted_at: string | null;
  }[],
  scores: {
    leadership: number;
    creativity: number;
    execution: number;
    commitment: number;
    total_score: number;
  }[]
): DashboardStats {
  const byStatus = {
    draft: 0,
    submitted: 0,
    under_review: 0,
    accepted: 0,
    rejected: 0,
  } as Record<ApplicationStatus, number>;

  applications.forEach((a) => {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
  });

  const dateMap = new Map<string, number>();
  applications.forEach((a) => {
    const d = (a.submitted_at ?? a.created_at).slice(0, 10);
    dateMap.set(d, (dateMap.get(d) ?? 0) + 1);
  });

  const applicationsOverTime = Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const n = scores.length || 1;
  const avg = (fn: (s: (typeof scores)[0]) => number) =>
    scores.length
      ? (scores.reduce((sum, s) => sum + fn(s), 0) / scores.length).toFixed(1)
      : "0";

  return {
    totalUsers: profiles.length,
    activeUsers: profiles.filter((p) => p.status === "active").length,
    suspendedUsers: profiles.filter((p) => p.status === "suspended").length,
    totalApplications: applications.length,
    byStatus,
    accepted: byStatus.accepted,
    rejected: byStatus.rejected,
    avgScores: {
      leadership: Number(avg((s) => s.leadership)),
      creativity: Number(avg((s) => s.creativity)),
      execution: Number(avg((s) => s.execution)),
      commitment: Number(avg((s) => s.commitment)),
      total: Number(avg((s) => s.total_score)),
    },
    applicationsOverTime,
  };
}
