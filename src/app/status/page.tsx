import { ReadOnlyApplication } from "@/components/application/read-only-application";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isApplicationLocked, parseAnswers } from "@/lib/applications";
import { getOwnProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types/database";
import { STATUS_LABELS } from "@/types/database";
import { redirect } from "next/navigation";

function statusVariant(
  status: ApplicationStatus
): "default" | "success" | "warning" | "gold" {
  if (status === "accepted") return "success";
  if (status === "rejected") return "warning";
  if (status === "under_review") return "gold";
  return "default";
}

const STATUS_HELP: Record<ApplicationStatus, string> = {
  draft: "Complete and submit your application.",
  submitted: "Your application was received and is awaiting review.",
  under_review: "The selection committee is reviewing your application.",
  accepted: "Congratulations — you have been accepted as an officer candidate.",
  rejected: "Thank you for applying. Please speak with your advisor for next steps.",
};

export default async function StatusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/status");

  const [{ data: profile }, { data: row }] = await Promise.all([
    getOwnProfile(supabase, user, "role, full_name, grade, status, email"),
    supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profile?.role === "admin") redirect("/dashboard");
  if (profile?.status === "suspended") redirect("/suspended");
  if (!row || row.status === "draft") redirect("/apply");

  const application: Application = {
    ...(row as Application),
    answers: parseAnswers(row.answers),
  };

  if (!isApplicationLocked(application.status)) redirect("/apply");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-deca-navy sm:text-3xl">
          Application status
        </h1>
        <p className="mt-1 text-sm text-deca-navy/60">
          Track your officer application — read-only after submission.
        </p>
      </div>

      <Card className="mb-8 animate-slide-up">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-deca-navy/50">
              Current status
            </p>
            <div className="mt-2">
              <Badge variant={statusVariant(application.status)} className="text-sm">
                {STATUS_LABELS[application.status]}
              </Badge>
            </div>
            <p className="mt-3 max-w-md text-sm text-deca-navy/70">
              {STATUS_HELP[application.status]}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-deca-navy/50">Submitted</p>
            <p className="font-medium text-deca-navy">
              {formatDate(application.submitted_at)}
            </p>
          </div>
        </div>
      </Card>

      <ReadOnlyApplication
        application={application}
        grade={profile?.grade}
      />
    </div>
  );
}
