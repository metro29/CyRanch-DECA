"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  REPORT_CATEGORIES,
  type Report,
  type ReportCategory,
  type ReportWithProfile,
} from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ReportsPanelProps {
  initialReports: Report[] | ReportWithProfile[];
  userId: string;
  isAdmin: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ReportsPanel({
  initialReports,
  userId,
  isAdmin,
}: ReportsPanelProps) {
  const router = useRouter();
  const supabase = createClient();
  const [reports, setReports] = useState(initialReports);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<ReportCategory>("general");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitReport = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        subject: subject.trim(),
        category,
        body: body.trim(),
      })
      .select("*")
      .single();

    setSubmitting(false);

    if (error || !data) {
      toast.error(error?.message ?? "Failed to submit report");
      return;
    }

    setReports((prev) => [data as Report, ...prev]);
    setSubject("");
    setBody("");
    setCategory("general");
    toast.success("Report submitted");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {!isAdmin && (
        <Card>
          <CardTitle>Submit a report</CardTitle>
          <div className="mt-4 space-y-4">
            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-deca-navy dark:text-white/90">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="w-full rounded-lg border border-deca-navy/15 bg-white px-4 py-2.5 text-deca-navy dark:border-white/15 dark:bg-deca-navy dark:text-white"
              >
                {REPORT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              label="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe the issue, suggestion, or feedback..."
              rows={5}
            />
            <Button onClick={submitReport} loading={submitting}>
              Submit report
            </Button>
          </div>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-deca-navy dark:text-white">
          {isAdmin ? "All submissions" : "Your submissions"}
        </h2>
        {reports.length === 0 ? (
          <Card>
            <p className="text-sm text-deca-navy/60 dark:text-white/60">
              {isAdmin
                ? "No reports have been submitted yet."
                : "You have not submitted any reports yet."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const withProfile = report as ReportWithProfile;
              return (
                <Card key={report.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-deca-navy dark:text-white">
                        {report.subject}
                      </p>
                      <p className="text-xs text-deca-navy/50 dark:text-white/50">
                        {formatDate(report.created_at)} ·{" "}
                        <span className="capitalize">{report.category}</span>
                      </p>
                    </div>
                    {isAdmin && withProfile.profiles && (
                      <p className="text-sm text-deca-gold-muted dark:text-deca-gold-light">
                        {withProfile.profiles.full_name ??
                          withProfile.profiles.email}
                      </p>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-deca-navy/70 dark:text-white/70">
                    {report.body}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
