import { getOwnProfile } from "@/lib/profile.server";
import { resolveIsAdmin } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await getOwnProfile(
    supabase,
    user,
    "id, role, status, email"
  );

  if (profileError || !profile) {
    return {
      error: NextResponse.json(
        {
          error: "Profile not found",
          detail: profileError?.message,
        },
        { status: 403 }
      ),
    };
  }

  if (!resolveIsAdmin(profile.role, user.email)) {
    return {
      error: NextResponse.json(
        {
          error: "Forbidden — your account role is not admin",
          role: profile.role,
          hint: "Run the make-admin SQL in Supabase, then sign out and sign back in.",
        },
        { status: 403 }
      ),
    };
  }

  if (profile.status === "suspended") {
    return {
      error: NextResponse.json({ error: "Account suspended" }, { status: 403 }),
    };
  }

  return { user, profile, supabase };
}
