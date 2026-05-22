/** Normalize profile.role from DB (enum or string). */
export function isAdminRole(role: unknown): boolean {
  if (role == null) return false;
  return String(role).trim().toLowerCase() === "admin";
}
