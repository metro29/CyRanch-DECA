import { isBootstrapAdminEmail } from "@/lib/bootstrap-admins";
import {
  canAutoRepairProfile,
  ensureProfileForAuthUser,
} from "@/lib/ensure-profile";
import { isAdminRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

export async function getOwnProfile<
  T extends string = "id, email, full_name, role, status, grade",
>(
  supabase: SupabaseClient,
  user: AuthUserLike,
  columns: T = "id, email, full_name, role, status, grade" as T
) {
  if (user.email && canAutoRepairProfile()) {
    try {
      await ensureProfileForAuthUser(user);
    } catch {
      /* logged below via admin read */
    }

    try {
      const admin = createAdminClient();

      const byId = await admin
        .from("profiles")
        .select(columns)
        .eq("id", user.id)
        .maybeSingle();

      if (byId.data) {
        return byId;
      }

      const byEmail = await admin
        .from("profiles")
        .select(columns)
        .ilike("email", user.email.trim())
        .limit(1)
        .maybeSingle();

      if (byEmail.data) {
        return byEmail;
      }

      if (isBootstrapAdminEmail(user.email)) {
        return {
          data: {
            id: user.id,
            email: user.email,
            full_name: null,
            role: "admin",
            status: "active",
            grade: null,
          } as Record<string, unknown>,
          error: null,
          count: null,
          status: 200,
          statusText: "OK",
        };
      }

      return byId.error ? byId : byEmail;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Admin profile read failed";
      if (isBootstrapAdminEmail(user.email)) {
        return {
          data: {
            id: user.id,
            email: user.email,
            role: "admin",
          } as Record<string, unknown>,
          error: null,
          count: null,
          status: 200,
          statusText: "OK",
        };
      }
      return { data: null, error: { message }, count: null, status: 500, statusText: "" };
    }
  }

  const result = await supabase
    .from("profiles")
    .select(columns)
    .eq("id", user.id)
    .maybeSingle();

  if (!result.data && isBootstrapAdminEmail(user.email)) {
    return {
      ...result,
      data: {
        id: user.id,
        email: user.email,
        role: "admin",
      } as Record<string, unknown>,
    };
  }

  return result;
}

export function resolveIsAdmin(
  role: unknown,
  email: string | null | undefined
): boolean {
  return isAdminRole(role) || isBootstrapAdminEmail(email);
}
