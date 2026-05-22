"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { isAdminRole } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Whoami {
  loggedIn?: boolean;
  isAdmin?: boolean;
  canUseAdminApi?: boolean;
  profile?: { id?: string; role?: string; email?: string } | null;
  profileIdMatchesUser?: boolean;
  profileError?: string | null;
  userId?: string;
}

interface AccountStatusCardProps {
  email: string;
  serverRole: unknown;
  serverIsAdmin?: boolean;
  loginUserId?: string;
  profileId?: string | null;
}

export function AccountStatusCard({
  email,
  serverRole,
  serverIsAdmin = false,
  loginUserId,
  profileId,
}: AccountStatusCardProps) {
  const router = useRouter();
  const serverAdmin = serverIsAdmin || isAdminRole(serverRole);
  const isAdmin = useIsAdmin(serverAdmin);
  const [whoami, setWhoami] = useState<Whoami | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadWhoami = () => {
    fetch("/api/admin/whoami")
      .then((r) => r.json())
      .then(setWhoami)
      .catch(() => setWhoami(null));
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/admin/whoami");
        const w = (await res.json()) as Whoami;
        if (cancelled) return;
        setWhoami(w);

        const needsRepair =
          w.profileError ||
          (w.loggedIn && !w.profile) ||
          w.profileIdMatchesUser === false;

        if (needsRepair) {
          const syncRes = await fetch("/api/profile/sync", { method: "POST" });
          if (!cancelled && syncRes.ok) {
            const again = await fetch("/api/admin/whoami");
            if (!cancelled) setWhoami(await again.json());
            router.refresh();
          }
        }
      } catch {
        if (!cancelled) setWhoami(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const syncProfile = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/profile/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Sync failed");
        return;
      }
      toast.success(
        data.isAdmin
          ? "Account synced — you are admin"
          : "Account synced — you are a member"
      );
      loadWhoami();
      router.refresh();
    } catch {
      toast.error("Sync failed");
    }
    setSyncing(false);
  };

  const dbRole =
    whoami?.profile?.role ??
    (serverRole ? String(serverRole) : serverIsAdmin ? "admin" : "unknown");
  const label = isAdmin || whoami?.isAdmin ? "Admin" : "Member";
  const idMismatch =
    loginUserId &&
    profileId &&
    loginUserId !== profileId &&
    whoami?.profileIdMatchesUser === false;

  return (
    <Card>
      <CardTitle>Account type</CardTitle>
      <p className="mt-2 text-sm text-deca-navy/70 dark:text-white/70">
        The app sees you as:{" "}
        <strong className={isAdmin ? "text-emerald-600" : "text-deca-navy dark:text-white"}>
          {label}
        </strong>{" "}
        (database role: <code className="text-xs">{dbRole}</code>)
      </p>
      {whoami?.profileError && (
        <p className="mt-2 text-sm text-red-600">
          Profile error: {whoami.profileError}
        </p>
      )}
      {idMismatch && (
        <p className="mt-2 text-sm text-red-600">
          Login id and profile id differ — sign out everywhere, close the browser, sign
          in again.
        </p>
      )}
      {whoami?.serviceRoleConfigured === false && (
        <p className="mt-2 text-sm text-amber-800">
          Service role key not loaded — restart <code>npm run dev</code> after editing{" "}
          <code>.env.local</code>.
        </p>
      )}
      {isAdmin && whoami?.canUseAdminApi === false && (
        <p className="mt-2 text-sm text-amber-800">
          Role is admin but server actions may fail — add{" "}
          <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
          <code className="text-xs">.env.local</code> and restart the app.
        </p>
      )}
      {whoami?.userId &&
        whoami.profile &&
        whoami.profileIdMatchesUser === false && (
        <p className="mt-2 text-sm text-amber-800">
          Profile id does not match your login — click Sync account below.
        </p>
      )}

      {!isAdmin && !serverIsAdmin && (
        <div className="mt-4 space-y-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">
            SQL says admin but app says Member? Usually the profile row is tied to
            the wrong id.
          </p>
          <Button size="sm" onClick={syncProfile} loading={syncing}>
            Sync account with login
          </Button>
          <p className="text-xs opacity-80">
            Or run <code>FIX-DUPLICATE-PROFILES.sql</code> in Supabase, then sign out
            and in. Signed in as {email}
          </p>
        </div>
      )}

      {isAdmin && whoami?.canUseAdminApi === false && (
        <Button
          size="sm"
          className="mt-3"
          variant="outline"
          onClick={syncProfile}
          loading={syncing}
        >
          Re-sync account
        </Button>
      )}
    </Card>
  );
}
