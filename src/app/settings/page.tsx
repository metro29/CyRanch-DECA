import { AccountStatusCard } from "@/components/club/account-status-card";
import { SettingsPanel } from "@/components/club/settings-panel";
import { PageShell } from "@/components/layout/page-shell";
import { getOwnProfile, resolveIsAdmin } from "@/lib/profile";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/settings");

  const { data: profile, error: profileError } = await getOwnProfile(
    supabase,
    user,
    "id, full_name, email, role"
  );

  return (
    <PageShell
      title="Settings"
      description="Manage your account and app preferences."
      icon="settings"
    >
      <div className="mx-auto max-w-lg space-y-6">
        <AccountStatusCard
          email={profile?.email ?? user.email ?? ""}
          serverRole={profile?.role}
          serverIsAdmin={resolveIsAdmin(profile?.role, user.email)}
          loginUserId={user.id}
          profileId={profile?.id ?? null}
        />
        {profileError && (
          <p className="text-sm text-red-600">
            Could not load profile: {profileError.message}. Click Sync account or run
            FIX-DUPLICATE-PROFILES.sql in Supabase.
          </p>
        )}
        {!profile && !profileError && (
          <p className="text-sm text-amber-800">
            No profile row for your login yet — click Sync account below.
          </p>
        )}
      <SettingsPanel
        userId={user.id}
        email={user.email ?? ""}
        initialName={profile?.full_name ?? ""}
        isAdmin={resolveIsAdmin(profile?.role, user.email)}
      />
      </div>
    </PageShell>
  );
}
