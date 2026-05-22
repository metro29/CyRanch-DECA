"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types/database";
import { STATUS_LABELS } from "@/types/database";
import { FileText, Lock } from "lucide-react";

const SECTIONS: { key: keyof Application["answers"]; label: string }[] = [
  { key: "leadership_experience", label: "Leadership Experience" },
  { key: "motivation", label: "Motivation for DECA" },
  { key: "officer_goals", label: "Officer Goals" },
  { key: "ideas_for_year", label: "Ideas for the Year" },
  { key: "execution_plan", label: "Execution Plan" },
  { key: "skills", label: "Skills & Strengths" },
];

function statusVariant(
  status: ApplicationStatus
): "default" | "success" | "warning" | "gold" {
  switch (status) {
    case "accepted":
      return "success";
    case "rejected":
      return "warning";
    case "under_review":
      return "gold";
    case "submitted":
      return "default";
    default:
      return "default";
  }
}

interface ReadOnlyApplicationProps {
  application: Application;
  grade?: string | null;
}

export function ReadOnlyApplication({
  application,
  grade,
}: ReadOnlyApplicationProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deca-navy sm:text-3xl">
            Your Application
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-deca-navy/60">
            <Lock className="h-4 w-4" />
            Submitted applications are read-only. Contact an admin to unlock.
          </p>
        </div>
        <Badge variant={statusVariant(application.status)}>
          {STATUS_LABELS[application.status]}
        </Badge>
      </div>

      <Card className="bg-deca-cream/50">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-deca-navy/50">Submitted</span>
            <p className="font-medium">{formatDate(application.submitted_at)}</p>
          </div>
          {grade && (
            <div>
              <span className="text-deca-navy/50">Grade</span>
              <p className="font-medium">{grade}</p>
            </div>
          )}
          {application.resume_url && (
            <div>
              <span className="text-deca-navy/50">Resume</span>
              <p className="flex items-center gap-1 font-medium">
                <FileText className="h-4 w-4 text-deca-gold" />
                PDF uploaded
              </p>
            </div>
          )}
        </div>
      </Card>

      {SECTIONS.map(({ key, label }) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-base">{label}</CardTitle>
          </CardHeader>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-deca-navy/80">
            {application.answers[key] || "—"}
          </p>
        </Card>
      ))}
    </div>
  );
}
