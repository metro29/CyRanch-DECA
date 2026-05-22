import { HomeMarketing } from "@/components/home/home-marketing";
import { getOwnProfile } from "@/lib/profile.server";
import { createClient } from "@/lib/supabase/server";
import { resolveUserHomePath } from "@/lib/navigation";
import { resolveIsAdmin } from "@/lib/roles";
import { getAppSettings } from "@/lib/settings";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let applicationStatus: string | null = null;
  const settings = await getAppSettings(supabase);

  if (user) {
    const [{ data: p }, { data: app }] = await Promise.all([
      getOwnProfile(supabase, user, "role"),
      supabase
        .from("applications")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    profile = p;
    applicationStatus = app?.status ?? null;
  }

  const userHome = user
    ? resolveUserHomePath({
        role: profile?.role,
        applicationStatus: applicationStatus as never,
        applicationsOpen: settings.applications_open,
      })
    : null;

  const ctaHref = user
    ? resolveIsAdmin(profile?.role, user.email)
      ? "/dashboard"
      : userHome && userHome !== "/"
        ? userHome
        : "/about"
    : settings.applications_open
      ? "/signup"
      : "/login";

  const ctaLabel = user
    ? resolveIsAdmin(profile?.role, user.email)
      ? "Open dashboard"
      : applicationStatus && applicationStatus !== "draft"
        ? "View status"
        : settings.applications_open
          ? "Continue application"
          : "Browse chapter"
    : settings.applications_open
      ? "Create account"
      : "Log in";

  return (
    <HomeMarketing
      seasonLabel={settings.season_label}
      applicationsOpen={settings.applications_open}
      closedMessage={settings.closed_message}
      ctaHref={ctaHref}
      ctaLabel={ctaLabel}
      showLoginButton={!user}
    />
  );
}
