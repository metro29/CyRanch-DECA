"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Profile } from "@/types/database";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

interface MembersPanelProps {
  members: Profile[];
}

function formatJoined(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MembersPanel({ members }: MembersPanelProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        m.full_name?.toLowerCase().includes(q) ||
        m.grade?.includes(q)
    );
  }, [members, search]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deca-navy/40" />
        <Input
          className="pl-9"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-deca-navy/10 bg-deca-cream/80 dark:border-white/10 dark:bg-deca-navy/50">
                <th className="px-4 py-3 font-semibold text-deca-navy dark:text-white">
                  Name
                </th>
                <th className="px-4 py-3 font-semibold text-deca-navy dark:text-white">
                  Email
                </th>
                <th className="px-4 py-3 font-semibold text-deca-navy dark:text-white">
                  Grade
                </th>
                <th className="px-4 py-3 font-semibold text-deca-navy dark:text-white">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-deca-navy/50 dark:text-white/50"
                  >
                    {members.length === 0
                      ? "No members yet."
                      : "No members match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-deca-navy/5 last:border-0 dark:border-white/5"
                  >
                    <td className="px-4 py-3 font-medium text-deca-navy dark:text-white">
                      {member.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-deca-navy/80 dark:text-white/80">
                      <a
                        href={`mailto:${member.email}`}
                        className="hover:text-deca-gold-muted hover:underline"
                      >
                        {member.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-deca-navy/70 dark:text-white/70">
                      {member.grade || "—"}
                    </td>
                    <td className="px-4 py-3 text-deca-navy/50 dark:text-white/50">
                      {formatJoined(member.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-deca-navy/50 dark:text-white/50">
        {filtered.length} of {members.length} member
        {members.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
