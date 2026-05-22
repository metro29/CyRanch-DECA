"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import type {
  ApplicationStatus,
  ApplicationWithScore,
  Score,
} from "@/types/database";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
} from "@/types/database";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Star,
  Unlock,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface ApplicationsPanelProps {
  applications: ApplicationWithScore[];
}

type SortMode = "newest" | "score";
type ScoreFilter = "all" | "unscored" | "scored";

const SCORE_DIMS = [
  ["leadership", "Leadership"],
  ["creativity", "Creativity"],
  ["execution", "Execution"],
  ["commitment", "Commitment"],
] as const;

function statusBadgeVariant(
  status: ApplicationStatus
): "default" | "success" | "warning" | "gold" {
  if (status === "accepted") return "success";
  if (status === "rejected") return "warning";
  if (status === "under_review") return "gold";
  return "default";
}

export function ApplicationsPanel({ applications: initial }: ApplicationsPanelProps) {
  const supabase = createClient();
  const [apps, setApps] = useState(initial);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [selected, setSelected] = useState<ApplicationWithScore | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusEdit, setStatusEdit] = useState<ApplicationStatus>("submitted");
  const [scores, setScores] = useState({
    leadership: 5,
    creativity: 5,
    execution: 5,
    commitment: 5,
  });
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingScore, setSavingScore] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [loadingResume, setLoadingResume] = useState(false);

  const grades = useMemo(() => {
    const set = new Set(
      apps.map((a) => a.profiles?.grade).filter(Boolean) as string[]
    );
    return Array.from(set).sort();
  }, [apps]);

  const filtered = useMemo(() => {
    let list = [...apps];

    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (gradeFilter !== "all") {
      list = list.filter((a) => a.profiles?.grade === gradeFilter);
    }
    if (scoreFilter === "unscored") {
      list = list.filter((a) => !a.scores);
    } else if (scoreFilter === "scored") {
      list = list.filter((a) => !!a.scores);
    }
    const min = scoreMin ? Number(scoreMin) : null;
    const max = scoreMax ? Number(scoreMax) : null;
    if (min !== null && !Number.isNaN(min)) {
      list = list.filter((a) => (a.scores?.total_score ?? 0) >= min);
    }
    if (max !== null && !Number.isNaN(max)) {
      list = list.filter((a) => (a.scores?.total_score ?? 0) <= max);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.profiles?.full_name?.toLowerCase().includes(q) ||
          a.profiles?.email?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortMode === "newest") {
        return (
          new Date(b.submitted_at ?? b.created_at).getTime() -
          new Date(a.submitted_at ?? a.created_at).getTime()
        );
      }
      const ta = a.scores?.total_score ?? 0;
      const tb = b.scores?.total_score ?? 0;
      return tb - ta;
    });

    return list;
  }, [apps, gradeFilter, scoreFilter, scoreMin, scoreMax, search, sortMode, statusFilter]);

  const openApplication = (app: ApplicationWithScore) => {
    setSelected(app);
    setAdminNotes(app.admin_notes ?? "");
    setStatusEdit(app.status);
    const sc = app.scores;
    setScores({
      leadership: sc?.leadership ?? 5,
      creativity: sc?.creativity ?? 5,
      execution: sc?.execution ?? 5,
      commitment: sc?.commitment ?? 5,
    });
  };

  const patchLocal = (id: string, patch: Partial<ApplicationWithScore>) => {
    setApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
    if (selected?.id === id) {
      setSelected((s) => (s ? { ...s, ...patch } : s));
    }
  };

  const saveAdminNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from("applications")
      .update({ admin_notes: adminNotes || null })
      .eq("id", selected.id);

    setSavingNotes(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    patchLocal(selected.id, { admin_notes: adminNotes || null });
    toast.success("Admin notes saved");
  };

  const saveStatus = async () => {
    if (!selected) return;
    setSavingStatus(true);
    const { error } = await supabase
      .from("applications")
      .update({ status: statusEdit })
      .eq("id", selected.id);

    setSavingStatus(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    patchLocal(selected.id, { status: statusEdit });
    toast.success(`Status updated to ${STATUS_LABELS[statusEdit]}`);
  };

  const unlockApplication = async () => {
    if (!selected) return;
    setUnlocking(true);
    const { error } = await supabase
      .from("applications")
      .update({ status: "draft", submitted_at: null })
      .eq("id", selected.id);

    setUnlocking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    patchLocal(selected.id, { status: "draft", submitted_at: null });
    setStatusEdit("draft");
    toast.success("Application unlocked for editing");
  };

  const persistScore = useCallback(
    async (app: ApplicationWithScore, scoreValues: typeof scores) => {
      const payload = {
        application_id: app.id,
        leadership: scoreValues.leadership,
        creativity: scoreValues.creativity,
        execution: scoreValues.execution,
        commitment: scoreValues.commitment,
      };

      if (app.scores) {
        const { data, error } = await supabase
          .from("scores")
          .update(payload)
          .eq("application_id", app.id)
          .select()
          .single();
        if (error) throw error;
        return data as Score;
      }

      const { data, error } = await supabase
        .from("scores")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Score;
    },
    [supabase]
  );

  const saveScore = async () => {
    if (!selected) return;
    setSavingScore(true);
    try {
      const saved = await persistScore(selected, scores);
      patchLocal(selected.id, { scores: saved });
      toast.success("Scores saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save score");
    }
    setSavingScore(false);
  };

  const downloadResume = async (url: string) => {
    setLoadingResume(true);
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(url, 120);
    setLoadingResume(false);
    if (error || !data?.signedUrl) {
      toast.error("Could not download resume");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const totalPreview =
    scores.leadership +
    scores.creativity +
    scores.execution +
    scores.commitment;

  const answerSections = selected
    ? [
        ["Leadership Experience", selected.answers.leadership_experience],
        ["Motivation", selected.answers.motivation],
        ["Officer Goals", selected.answers.officer_goals],
        ["Ideas for the Year", selected.answers.ideas_for_year],
        ["Execution Plan", selected.answers.execution_plan],
        ["Skills", selected.answers.skills],
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deca-navy sm:text-3xl">
            Applications
          </h1>
          <p className="mt-1 text-sm text-deca-navy/60">
            Review, score, and manage all officer applications
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deca-navy/40" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-deca-navy/15 py-2.5 pl-10 pr-4 text-sm focus:border-deca-gold focus:outline-none focus:ring-2 focus:ring-deca-gold/20"
            />
          </div>
          <FilterSelect
            label="Grade"
            value={gradeFilter}
            onChange={setGradeFilter}
            options={[
              { value: "all", label: "All grades" },
              ...grades.map((g) => ({ value: g, label: `Grade ${g}` })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as ApplicationStatus | "all")}
            options={[
              { value: "all", label: "All statuses" },
              ...APPLICATION_STATUSES.map((s) => ({
                value: s,
                label: STATUS_LABELS[s],
              })),
            ]}
          />
          <FilterSelect
            label="Score"
            value={scoreFilter}
            onChange={(v) => setScoreFilter(v as ScoreFilter)}
            options={[
              { value: "all", label: "All" },
              { value: "scored", label: "Scored" },
              { value: "unscored", label: "Unscored" },
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-deca-navy/50">Min score</label>
            <input
              type="number"
              min={0}
              max={40}
              value={scoreMin}
              onChange={(e) => setScoreMin(e.target.value)}
              placeholder="0"
              className="w-20 rounded-lg border border-deca-navy/15 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-deca-navy/50">Max score</label>
            <input
              type="number"
              min={0}
              max={40}
              value={scoreMax}
              onChange={(e) => setScoreMax(e.target.value)}
              placeholder="40"
              className="w-20 rounded-lg border border-deca-navy/15 px-2 py-1.5 text-sm"
            />
          </div>
          <SortButton
            active={sortMode === "newest"}
            onClick={() => setSortMode("newest")}
          >
            Newest first
          </SortButton>
          <SortButton
            active={sortMode === "score"}
            onClick={() => setSortMode("score")}
          >
            Highest score
          </SortButton>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
      <Card className="overflow-hidden p-0 lg:col-span-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-deca-navy/10 bg-deca-navy/5">
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Grade</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-deca-navy/50"
                  >
                    No applications match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((app, i) => (
                  <tr
                    key={app.id}
                    className={cn(
                      "cursor-pointer border-b border-deca-navy/5 transition-colors hover:bg-deca-gold/5",
                      selected?.id === app.id && "bg-deca-gold/10",
                      sortMode === "score" && i < 3 && app.scores && "bg-deca-gold/5"
                    )}
                    onClick={() => openApplication(app)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-deca-navy">
                        {app.profiles?.full_name ?? "—"}
                        {sortMode === "score" && i < 3 && app.scores && (
                          <span className="ml-2 text-xs text-deca-gold-muted">
                            #{i + 1}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-deca-navy/50">
                        {app.profiles?.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">{app.profiles?.grade ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeVariant(app.status)}>
                        {STATUS_LABELS[app.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-deca-gold-muted">
                      {app.scores?.total_score ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-deca-navy/70">
                      {formatDate(app.submitted_at)}
                    </td>
                    <td className="px-4 py-3 text-deca-gold-muted text-xs">
                      {selected?.id === app.id ? "Selected" : "→"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="lg:col-span-2">
        {selected ? (
          <Card className="sticky top-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between border-b border-deca-navy/10 pb-3">
              <h2 className="font-semibold text-deca-navy">
                {selected.profiles?.full_name ?? "Review"}
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-deca-navy/50 hover:text-deca-navy"
              >
                Close
              </button>
            </div>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-deca-navy/60">
              <span>{selected.profiles?.email}</span>
              {selected.profiles?.grade && (
                <>
                  <span>·</span>
                  <span>Grade {selected.profiles.grade}</span>
                </>
              )}
              <span>·</span>
              <span>{formatDate(selected.submitted_at)}</span>
              {selected.resume_url && (
                <>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => downloadResume(selected.resume_url!)}
                    disabled={loadingResume}
                    className="inline-flex items-center gap-1 text-deca-gold-muted hover:underline disabled:opacity-50"
                  >
                    {loadingResume ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Download resume
                  </button>
                </>
              )}
            </div>

            <div className="grid gap-4 rounded-xl border border-deca-navy/10 bg-deca-cream/50 p-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-deca-navy/70">
                  Application status
                </label>
                <select
                  value={statusEdit}
                  onChange={(e) =>
                    setStatusEdit(e.target.value as ApplicationStatus)
                  }
                  className="w-full rounded-lg border border-deca-navy/15 px-3 py-2 text-sm"
                >
                  {APPLICATION_STATUSES.filter((s) => s !== "draft").map(
                    (s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    )
                  )}
                  <option value="draft">Draft (unlock)</option>
                </select>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={saveStatus}
                    loading={savingStatus}
                  >
                    Update status
                  </Button>
                  {selected.status !== "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={unlockApplication}
                      loading={unlocking}
                    >
                      <Unlock className="h-4 w-4" />
                      Unlock for edit
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Textarea
                  label="Private admin notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal notes — not visible to applicant"
                />
                <Button
                  size="sm"
                  className="mt-2"
                  variant="secondary"
                  onClick={saveAdminNotes}
                  loading={savingNotes}
                >
                  Save notes
                </Button>
              </div>
            </div>

            {answerSections.map(([title, content]) => (
              <div key={title as string}>
                <h4 className="mb-2 text-sm font-semibold text-deca-navy">
                  {title}
                </h4>
                <p className="whitespace-pre-wrap rounded-lg bg-white border border-deca-navy/8 p-4 text-sm text-deca-navy/80">
                  {content as string || "—"}
                </p>
              </div>
            ))}

            {selected.status !== "draft" && (
              <div className="border-t border-deca-navy/10 pt-6">
                <h4 className="mb-4 text-sm font-semibold text-deca-navy">
                  Score application
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {SCORE_DIMS.map(([key, label]) => (
                    <div key={key}>
                      <label className="mb-2 block text-xs font-medium text-deca-navy/70">
                        {label} (1–10)
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={scores[key]}
                        onChange={(e) =>
                          setScores((s) => ({
                            ...s,
                            [key]: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-deca-gold"
                      />
                      <div className="mt-1 text-center text-lg font-bold text-deca-navy">
                        {scores[key]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-deca-navy px-4 py-3 text-center">
                  <span className="text-sm text-white/70">Total score</span>
                  <p className="text-3xl font-bold text-deca-gold">
                    {totalPreview}
                    <span className="text-lg text-white/50"> / 40</span>
                  </p>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={saveScore}
                  loading={savingScore}
                >
                  Save scores
                </Button>
              </div>
            )}
          </div>
          </Card>
        ) : (
          <Card className="sticky top-4 flex min-h-[240px] items-center justify-center p-8 text-center text-sm text-deca-navy/50">
            Select an application to review and score
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-deca-navy/50">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-deca-navy/15 px-3 py-2.5 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-deca-navy text-white"
          : "bg-deca-navy/5 text-deca-navy hover:bg-deca-navy/10"
      )}
    >
      {children}
    </button>
  );
}
