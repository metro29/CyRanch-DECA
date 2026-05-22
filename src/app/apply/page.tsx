import { ApplicationsClosed } from "@/components/application/applications-closed";
import { MultiStepForm } from "@/components/application/multi-step-form";
import { isApplicationLocked, parseAnswers } from "@/lib/applications";
import { canAccessApplyForm } from "@/lib/navigation";
import { getOwnProfile } from "@/lib/profile.server";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings";
import type { Application } from "@/types/database";
import { redirect } from "next/navigation";

export default async function ApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/apply");

  const [{ data: profile }, { data: row }, settings] = await Promise.all([
    getOwnProfile(supabase, user, "grade, role, status"),
    supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    getAppSettings(supabase),
  ]);

  if (profile?.role === "admin") redirect("/dashboard");
  if (profile?.status === "suspended") redirect("/suspended");

  const application: Application | null = row
    ? {
        ...(row as Application),
        answers: parseAnswers(row.answers),
      }
    : null;

  if (application && isApplicationLocked(application.status)) {
    redirect("/status");
  }

  const canApply = canAccessApplyForm({
    role: profile?.role,
    applicationStatus: application?.status ?? null,
    applicationsOpen: settings.applications_open,
  });

  if (!canApply) {
    return (
      <ApplicationsClosed
        settings={settings}
        hasSubmitted={!!application && application.status !== "draft"}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <MultiStepForm
        application={application}
        userId={user.id}
        grade={profile?.grade ?? null}
      />
    </div>
  );
}
