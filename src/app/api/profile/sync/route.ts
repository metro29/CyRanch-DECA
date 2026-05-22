import { ensureProfileForAuthUser } from "@/lib/ensure-profile";
import { resolveIsAdmin } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await ensureProfileForAuthUser(user);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      profile: result.profile,
      isAdmin: resolveIsAdmin(result.profile?.role, user.email),
      removedDuplicates: result.removedDuplicates,
      userId: user.id,
      profileId: result.profile?.id,
      profileIdMatchesUser: result.profile?.id === user.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json(
      {
        error: `${message}. Add SUPABASE_SERVICE_ROLE_KEY to .env.local or run FIX-DUPLICATE-PROFILES.sql in Supabase.`,
      },
      { status: 500 }
    );
  }
}
