"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import type { Profile, ProfileStatus, UserRole } from "@/types/database";
import {
  MoreHorizontal,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserX,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface UsersPanelProps {
  users: Profile[];
  currentAdminId: string;
}

export function UsersPanel({ users: initial, currentAdminId }: UsersPanelProps) {
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProfileStatus>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    type: "delete" | "suspend" | "promote" | "demote";
    user: Profile;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    let list = [...users];
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    if (statusFilter !== "all")
      list = list.filter((u) => u.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [users, search, roleFilter, statusFilter]);

  const patchRole = async (user: Profile, role: UserRole) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to update role");
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role } : u))
    );
    toast.success(
      role === "admin" ? "Promoted to admin" : "Demoted to user"
    );
    setConfirm(null);
  };

  const patchStatus = async (user: Profile, status: ProfileStatus) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to update status");
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status } : u))
    );
    toast.success(
      status === "suspended" ? "User suspended" : "User reactivated"
    );
    setConfirm(null);
  };

  const deleteUser = async (user: Profile) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to delete user");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    toast.success("User deleted permanently");
    setConfirm(null);
  };

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.type === "delete") return deleteUser(confirm.user);
    if (confirm.type === "suspend")
      return patchStatus(confirm.user, "suspended");
    if (confirm.type === "promote")
      return patchRole(confirm.user, "admin");
    if (confirm.type === "demote") return patchRole(confirm.user, "user");
  };

  const confirmCopy = (): {
    title: string;
    description: string;
    label: string;
    variant?: "primary" | "danger";
  } => {
    if (!confirm) return { title: "", description: "", label: "" };
    const name = confirm.user.full_name ?? confirm.user.email;
    switch (confirm.type) {
      case "delete":
        return {
          title: "Delete user permanently?",
          description: `This will permanently delete ${name}, their application, scores, and auth account. This action cannot be undone.`,
          label: "Delete user",
        };
      case "suspend":
        return {
          title: "Suspend user?",
          description: `${name} will be unable to access the portal until reactivated.`,
          label: "Suspend",
        };
      case "promote":
        return {
          title: "Promote to admin?",
          description: `${name} will gain full admin access to the dashboard.`,
          label: "Promote",
          variant: "primary" as const,
        };
      case "demote":
        return {
          title: "Demote to user?",
          description: `${name} will lose admin access.`,
          label: "Demote",
        };
    }
  };

  const copy = confirmCopy();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-deca-navy">Users</h1>
        <p className="mt-1 text-sm text-deca-navy/60">
          Manage registered accounts. Passwords are never stored or shown.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deca-navy/40" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-deca-navy/15 py-2.5 pl-10 pr-4 text-sm focus:border-deca-gold focus:outline-none focus:ring-2 focus:ring-deca-gold/20"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className="rounded-lg border border-deca-navy/15 px-3 py-2.5 text-sm"
          >
            <option value="all">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="rounded-lg border border-deca-navy/15 px-3 py-2.5 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-deca-navy/10 bg-deca-navy/5">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-deca-navy/50"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const isSelf = user.id === currentAdminId;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-deca-navy/5 hover:bg-deca-gold/5"
                    >
                      <td className="px-4 py-3 font-medium">
                        {user.full_name ?? "—"}
                        {isSelf && (
                          <span className="ml-2 text-xs text-deca-gold-muted">
                            (you)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-deca-navy/70">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === "admin" ? "gold" : "default"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            user.status === "active" ? "success" : "warning"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-deca-navy/70">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setMenuOpen(menuOpen === user.id ? null : user.id)
                            }
                            disabled={isSelf && user.role === "admin"}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          {menuOpen === user.id && (
                            <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-deca-navy/10 bg-white py-1 shadow-xl">
                              {user.role === "user" ? (
                                <ActionItem
                                  icon={Shield}
                                  label="Promote to admin"
                                  onClick={() => {
                                    setMenuOpen(null);
                                    setConfirm({ type: "promote", user });
                                  }}
                                />
                              ) : (
                                !isSelf && (
                                  <ActionItem
                                    icon={ShieldOff}
                                    label="Demote to user"
                                    onClick={() => {
                                      setMenuOpen(null);
                                      setConfirm({ type: "demote", user });
                                    }}
                                  />
                                )
                              )}
                              {user.status === "active" ? (
                                !isSelf && (
                                  <ActionItem
                                    icon={UserX}
                                    label="Suspend"
                                    onClick={() => {
                                      setMenuOpen(null);
                                      setConfirm({ type: "suspend", user });
                                    }}
                                  />
                                )
                              ) : (
                                <ActionItem
                                  icon={UserCheck}
                                  label="Reactivate"
                                  onClick={() => {
                                    setMenuOpen(null);
                                    patchStatus(user, "active");
                                  }}
                                />
                              )}
                              {!isSelf && (
                                <ActionItem
                                  icon={Trash2}
                                  label="Delete user"
                                  danger
                                  onClick={() => {
                                    setMenuOpen(null);
                                    setConfirm({ type: "delete", user });
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => !loading && setConfirm(null)}
        onConfirm={handleConfirm}
        title={copy.title}
        description={copy.description}
        confirmLabel={copy.label}
        variant={copy.variant ?? "danger"}
        loading={loading}
      />
    </div>
  );
}

function ActionItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-deca-navy/5 ${
        danger ? "text-red-600" : "text-deca-navy"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
