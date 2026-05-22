import { isBootstrapAdminEmail } from "@/lib/bootstrap-admins";

/** Normalize profile.role from DB (enum or string). */
export function isAdminRole(role: unknown): boolean {
  if (role == null) return false;
  return String(role).trim().toLowerCase() === "admin";
}

/** Safe for client + server — does not import service-role code. */
export function resolveIsAdmin(
  role: unknown,
  email: string | null | undefined
): boolean {
  return isAdminRole(role) || isBootstrapAdminEmail(email);
}
