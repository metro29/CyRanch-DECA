export const PUBLIC_NAV = [
  { href: "/about", label: "About DECA" },
  { href: "/officers", label: "Officers" },
  { href: "/calendar", label: "Calendar" },
  { href: "/follow-us", label: "Follow Us" },
] as const;

export const AUTH_NAV = [
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
] as const;

export const ADMIN_NAV = [
  { href: "/members", label: "Members" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/applications", label: "Applications" },
] as const;
