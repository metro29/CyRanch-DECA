import { isBootstrapAdminEmail } from "@/lib/bootstrap-admins";
import { isAdminRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

/**
 * One canonical profile row: profiles.id must equal auth.users.id.
 * Removes duplicate email rows and preserves admin role if any duplicate had it.
 */
export async function ensureProfileForAuthUser(user: AuthUserLike) {
  if (!user.email) {
    return { ok: false as const, error: "User has no email" };
  }

  const admin = createAdminClient();
  const email = user.email.trim();

  const { data: rows, error: listError } = await admin
    .from("profiles")
    .select("id, email, full_name, role, grade")
    .ilike("email", email);

  if (listError) {
    return { ok: false as const, error: listError.message };
  }

  const existing = rows ?? [];
  const anyAdmin = existing.some((r) => isAdminRole(r.role));
  const match = existing.find((r) => r.id === user.id);
  const bestName =
    match?.full_name ??
    existing.find((r) => r.full_name)?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    email.split("@")[0];
  const grade = match?.grade ?? existing.find((r) => r.grade)?.grade ?? null;
  const role =
    isBootstrapAdminEmail(email) || anyAdmin || isAdminRole(match?.role)
      ? "admin"
      : "user";

  const upsertPayload: Record<string, unknown> = {
    id: user.id,
    email,
    full_name: bestName,
    role,
  };
  if (grade) upsertPayload.grade = grade;

  const { data: profile, error: upsertError } = await admin
    .from("profiles")
    .upsert(upsertPayload, { onConflict: "id" })
    .select("id, email, full_name, role, grade")
    .single();

  if (upsertError) {
    return { ok: false as const, error: upsertError.message };
  }

  const { error: deleteError } = await admin
    .from("profiles")
    .delete()
    .ilike("email", email)
    .neq("id", user.id);

  if (deleteError) {
    return { ok: false as const, error: deleteError.message };
  }

  return {
    ok: true as const,
    profile,
    isAdmin: isAdminRole(profile.role),
    removedDuplicates: existing.length,
  };
}

export function canAutoRepairProfile() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
