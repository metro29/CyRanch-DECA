"use client";

import { isAdminRole } from "@/lib/roles";
import { useEffect, useState } from "react";

/** Server `initial` + live check from /api/admin/whoami */
export function useIsAdmin(initial: boolean) {
  const [isAdmin, setIsAdmin] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/whoami");
        const data = await res.json();
        if (!cancelled && data.loggedIn) {
          setIsAdmin(Boolean(data.isAdmin));
        }
      } catch {
        /* keep initial */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initial]);

  return isAdmin;
}
