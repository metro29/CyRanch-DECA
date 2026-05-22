import { MembersPanel } from "@/components/club/members-panel";
import { PageShell } from "@/components/layout/page-shell";
import { getOwnProfile } from "@/lib/profile.server";
import { resolveIsAdmin } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { redirect } from "next/navigation";

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/members");

  const { data: profile } = await getOwnProfile(supabase, user, "role");

  if (!resolveIsAdmin(profile?.role, user.email)) redirect("/");

  const { data: members, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, grade, role, created_at")
    .order("full_name", { ascending: true, nullsFirst: false })
    .order("email", { ascending: true });

  if (error) {
    console.error("[members]", error.message);
  }

  return (
    <PageShell
      title="Members"
      description="All chapter members who have signed up for the portal."
      icon="users"
    >
      <MembersPanel members={(members ?? []) as Profile[]} />
    </PageShell>
  );
}
