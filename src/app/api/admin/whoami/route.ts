import { requireAdmin } from "@/lib/admin-auth";
import { canAutoRepairProfile } from "@/lib/ensure-profile";
import { getOwnProfile } from "@/lib/profile.server";
import { resolveIsAdmin } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Debug: see what the server thinks your role is */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ loggedIn: false });
  }

  const { data: profile, error } = await getOwnProfile(
    supabase,
    user,
    "id, email, full_name, role, status"
  );

  const auth = await requireAdmin();

  const profileId = profile?.id;

  return NextResponse.json({
    loggedIn: true,
    userId: user.id,
    email: user.email,
    profile: profile ?? null,
    profileIdMatchesUser: profileId ? profileId === user.id : null,
    profileError: error?.message ?? null,
    isAdmin: resolveIsAdmin(profile?.role, user.email),
    canUseAdminApi: !auth.error,
    serviceRoleConfigured: canAutoRepairProfile(),
  });
}
