import type { ApplicationStatus, UserRole } from "@/types/database";

/** Where a logged-in user should land after auth */
export function resolveUserHomePath(opts: {
  role: UserRole | string | null | undefined;
  applicationStatus?: ApplicationStatus | null;
  applicationsOpen: boolean;
}): string {
  if (opts.role === "admin") return "/dashboard";

  if (
    opts.applicationStatus &&
    opts.applicationStatus !== "draft"
  ) {
    return "/status";
  }

  if (opts.applicationsOpen) return "/apply";

  return "/";
}

export function canAccessApplyForm(opts: {
  role: UserRole | string | null | undefined;
  applicationStatus?: ApplicationStatus | null;
  applicationsOpen: boolean;
}): boolean {
  if (opts.role === "admin") return false;
  if (opts.applicationsOpen) return true;
  return opts.applicationStatus === "draft";
}
