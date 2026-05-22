import { isBootstrapAdminEmail } from "@/lib/bootstrap-admins";
import {
  canAutoRepairProfile,
  ensureProfileForAuthUser,
} from "@/lib/ensure-profile";
import { isAdminRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, UserRole } from "@/types/database";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

/** Normalized profile row from DB or bootstrap fallback */
export type ProfileLookup = {
  id?: string;
  email?: string;
  full_name?: string | null;
  role?: UserRole | string | null;
  status?: string | null;
  grade?: string | null;
};

export type ProfileLookupResult = {
  data: ProfileLookup | null;
  error: PostgrestError | { message: string } | null;
};

function bootstrapProfile(user: AuthUserLike): ProfileLookup {
  return {
    id: user.id,
    email: user.email ?? undefined,
    full_name: null,
    role: "admin",
    status: "active",
    grade: null,
  };
}

function normalizeRow(row: unknown): ProfileLookup | null {
  if (!row || typeof row !== "object") return null;
  const r = row as ProfileLookup;
  return {
    id: r.id,
    email: r.email,
    full_name: r.full_name ?? null,
    role: r.role ?? null,
    status: r.status ?? null,
    grade: r.grade ?? null,
  };
}

function ok(data: ProfileLookup | null): ProfileLookupResult {
  return { data, error: null };
}

function fail(message: string): ProfileLookupResult {
  return { data: null, error: { message } };
}

export function asHeaderProfile(
  row: ProfileLookup | null | undefined
): Pick<Profile, "role" | "full_name"> | null {
  if (!row) return null;
  const role: UserRole = isAdminRole(row.role) ? "admin" : "user";
  return {
    role,
    full_name: typeof row.full_name === "string" ? row.full_name : null,
  };
}

export async function getOwnProfile(
  supabase: SupabaseClient,
  user: AuthUserLike,
  columns = "id, email, full_name, role, status, grade"
): Promise<ProfileLookupResult> {
  if (user.email && canAutoRepairProfile()) {
    try {
      await ensureProfileForAuthUser(user);
    } catch {
      /* try admin read below */
    }

    try {
      const admin = createAdminClient();

      const byId = await admin
        .from("profiles")
        .select(columns)
        .eq("id", user.id)
        .maybeSingle();

      if (byId.data) {
        return ok(normalizeRow(byId.data));
      }

      const byEmail = await admin
        .from("profiles")
        .select(columns)
        .ilike("email", user.email.trim())
        .limit(1)
        .maybeSingle();

      if (byEmail.data) {
        return ok(normalizeRow(byEmail.data));
      }

      if (isBootstrapAdminEmail(user.email)) {
        return ok(bootstrapProfile(user));
      }

      if (byId.error) {
        return fail(byId.error.message);
      }
      if (byEmail.error) {
        return fail(byEmail.error.message);
      }
      return ok(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Admin profile read failed";
      if (isBootstrapAdminEmail(user.email)) {
        return ok(bootstrapProfile(user));
      }
      return fail(message);
    }
  }

  const result = await supabase
    .from("profiles")
    .select(columns)
    .eq("id", user.id)
    .maybeSingle();

  if (result.data) {
    return ok(normalizeRow(result.data));
  }

  if (isBootstrapAdminEmail(user.email)) {
    return ok(bootstrapProfile(user));
  }

  if (result.error) {
    return fail(result.error.message);
  }

  return ok(null);
}

export function resolveIsAdmin(
  role: unknown,
  email: string | null | undefined
): boolean {
  return isAdminRole(role) || isBootstrapAdminEmail(email);
}
