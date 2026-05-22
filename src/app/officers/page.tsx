import { OfficersPanel } from "@/components/club/officers-panel";
import { PageShell } from "@/components/layout/page-shell";
import { getOwnProfile, resolveIsAdmin } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Officer } from "@/types/database";
export default async function OfficersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await getOwnProfile(supabase, user, "role");
    isAdmin = resolveIsAdmin(profile?.role, user.email);
  }

  const { data: officers } = await supabase
    .from("officers")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <PageShell
      title="Officer Team"
      description="Meet the students leading our DECA chapter this year."
      icon="users"
    >
      <OfficersPanel
        initialOfficers={(officers ?? []) as Officer[]}
        isAdmin={isAdmin}
      />
    </PageShell>
  );
}
