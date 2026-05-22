"use client";

import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { createClient } from "@/lib/supabase/client";
import { resolveIsAdmin } from "@/lib/roles";
import { ADMIN_NAV, AUTH_NAV, PUBLIC_NAV } from "@/lib/site-nav";
import type { ApplicationStatus, Profile } from "@/types/database";
import { cn } from "@/lib/utils";
import { Award, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface HeaderProps {
  user?: { email: string } | null;
  profile?: Pick<Profile, "role" | "full_name"> | null;
  applicationStatus?: ApplicationStatus | string | null;
  applicationsOpen?: boolean;
}

const DRAWER_WIDTH = "w-56";

function roleLabel(
  user: HeaderProps["user"],
  role: unknown,
  isAdmin: boolean
): string {
  if (!user) return "Guest";
  if (isAdmin) return "Admin";
  return "Member";
}

export function Header({
  user,
  profile,
  applicationStatus,
  applicationsOpen = false,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  const isAdmin = useIsAdmin(resolveIsAdmin(profile?.role, user?.email));
  const accountType = roleLabel(user, profile?.role, isAdmin);
  const hasSubmitted =
    applicationStatus && applicationStatus !== "draft";
  const showApply =
    user && !isAdmin && (applicationsOpen || applicationStatus === "draft");

  const navLinks = [
    ...PUBLIC_NAV.map((l) => ({ href: l.href, label: l.label })),
    ...(user ? AUTH_NAV.map((l) => ({ href: l.href, label: l.label })) : []),
    ...(isAdmin ? ADMIN_NAV.map((l) => ({ href: l.href, label: l.label })) : []),
    ...(user && !isAdmin
      ? [
          ...(showApply ? [{ href: "/apply", label: "Apply" }] : []),
          ...(hasSubmitted ? [{ href: "/status", label: "Status" }] : []),
        ]
      : []),
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const drawer =
    menuOpen && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[60] bg-deca-navy/25 backdrop-blur-[1px] dark:bg-black/50"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <aside
              className={cn(
                "fixed top-0 right-0 z-[70] flex h-dvh max-w-[85vw] flex-col border-l border-deca-navy/10 bg-white shadow-xl animate-slide-in-right dark:border-white/10 dark:bg-deca-navy-light",
                DRAWER_WIDTH
              )}
              aria-label="Navigation menu"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-deca-navy/10 px-3 dark:border-white/10">
                <span className="text-xs font-semibold uppercase tracking-wide text-deca-navy/50 dark:text-white/50">
                  Menu
                </span>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-deca-navy hover:bg-deca-navy/5 dark:text-white dark:hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">
                {navLinks.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "mx-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-deca-navy/8 text-deca-gold-muted dark:bg-white/10 dark:text-deca-gold-light"
                          : "text-deca-navy hover:bg-deca-navy/5 dark:text-white/90 dark:hover:bg-white/5"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="shrink-0 border-t border-deca-navy/10 p-3 dark:border-white/10">
                {user ? (
                  <div className="space-y-2">
                    <p className="truncate text-xs text-deca-navy/50 dark:text-white/50">
                      {profile?.full_name || user.email}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="h-8 w-full justify-start px-2 text-sm text-deca-navy dark:text-white"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/login" onClick={() => setMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="h-8 w-full text-sm">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setMenuOpen(false)}>
                      <Button size="sm" className="h-8 w-full text-sm">
                        Sign up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-deca-navy/10 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-deca-navy/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                isAdmin
                  ? "bg-deca-gold/20 text-deca-gold-muted dark:text-deca-gold-light"
                  : user
                    ? "bg-deca-navy/8 text-deca-navy/70 dark:bg-white/10 dark:text-white/80"
                    : "bg-deca-navy/5 text-deca-navy/50 dark:bg-white/5 dark:text-white/50"
              )}
            >
              {accountType}
            </span>
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-deca-navy">
                <Award className="h-4 w-4 text-deca-gold" />
              </div>
              <div className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-bold text-deca-navy dark:text-white">
                  DECA Officers
                </span>
                <span className="hidden truncate text-[11px] text-deca-navy/50 dark:text-white/50 sm:block">
                  Application Portal
                </span>
              </div>
            </Link>
          </div>

          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-deca-navy/10 text-deca-navy transition-colors hover:bg-deca-navy/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>
      {drawer}
    </>
  );
}
