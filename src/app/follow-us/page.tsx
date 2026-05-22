import { FollowUsPanel } from "@/components/club/follow-us-panel";
import { PageShell } from "@/components/layout/page-shell";
import { getOwnProfile } from "@/lib/profile.server";
import { resolveIsAdmin } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { ClubInfo, ClubSocial } from "@/types/database";
export default async function FollowUsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await getOwnProfile(supabase, user, "role");
    isAdmin = resolveIsAdmin(profile?.role, user.email);
  }

  const [{ data: socials }, { data: info }] = await Promise.all([
    supabase
      .from("club_socials")
      .select("*")
      .order("display_order", { ascending: true }),
    supabase.from("club_info").select("*").eq("id", 1).maybeSingle(),
  ]);

  return (
    <PageShell
      title="Follow Us"
      description="Stay connected with our chapter on social media and get the latest club updates."
      icon="share"
    >
      <FollowUsPanel
        initialSocials={(socials ?? []) as ClubSocial[]}
        initialInfo={(info ?? { id: 1, description: "", updated_at: "" }) as ClubInfo}
        isAdmin={isAdmin}
      />
    </PageShell>
  );
}
