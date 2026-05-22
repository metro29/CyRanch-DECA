"use client";

import { cn } from "@/lib/utils";
import { Award, FileText, LayoutDashboard, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/applications", label: "Applications", icon: FileText },
  { href: "/members", label: "Members", icon: Users },
  { href: "/dashboard/users", label: "Manage users", icon: UserCog },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-deca-navy/10 bg-white lg:w-56 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2.5 border-b border-deca-navy/10 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-deca-navy">
          <Award className="h-5 w-5 text-deca-gold" />
        </div>
        <div>
          <p className="text-sm font-bold text-deca-navy">DECA Admin</p>
          <p className="text-xs text-deca-navy/50">Control panel</p>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-deca-navy text-white"
                  : "text-deca-navy/70 hover:bg-deca-navy/5 hover:text-deca-navy"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
