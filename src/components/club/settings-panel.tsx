"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Moon, Sun, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface SettingsPanelProps {
  userId: string;
  email: string;
  initialName: string;
  isAdmin: boolean;
}

export function SettingsPanel({
  userId,
  email,
  initialName,
  isAdmin,
}: SettingsPanelProps) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveName = async () => {
    if (!displayName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: displayName.trim() })
      .eq("id", userId);
    setSavingName(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Name updated");
    router.refresh();
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Enter your current and new password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSavingPassword(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      setSavingPassword(false);
      toast.error("Current password is incorrect");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete account");
      }
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
      toast.success("Account deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
    setDeleting(false);
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-deca-gold/30 bg-gradient-to-br from-white to-deca-cream dark:from-deca-navy-light dark:to-deca-navy">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-deca-navy dark:bg-deca-gold/20">
            <User className="h-7 w-7 text-deca-gold" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-deca-navy/50 dark:text-white/50">
              Signed in as
            </p>
            <p className="text-xl font-bold text-deca-navy dark:text-white">
              {displayName || email}
            </p>
            <p className="text-sm text-deca-navy/60 dark:text-white/60">{email}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Display name</CardTitle>
        <div className="mt-4 space-y-4">
          <Input
            label="Full name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Button onClick={saveName} loading={savingName}>
            Save name
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Appearance</CardTitle>
        <p className="mt-2 text-sm text-deca-navy/60 dark:text-white/60">
          Switch between light and dark mode.
        </p>
        <div className="mt-4 flex gap-3">
          <Button
            variant={theme === "light" ? "primary" : "outline"}
            onClick={() => setTheme("light")}
          >
            <Sun className="h-4 w-4" />
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "primary" : "outline"}
            onClick={() => setTheme("dark")}
          >
            <Moon className="h-4 w-4" />
            Dark
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Change password</CardTitle>
        <p className="mt-2 text-sm text-deca-navy/60 dark:text-white/60">
          Enter your current password, then choose a new one. No email
          confirmation required.
        </p>
        <div className="mt-4 space-y-4">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Button onClick={changePassword} loading={savingPassword}>
            Update password
          </Button>
        </div>
      </Card>

      <Card className="border-red-200 dark:border-red-900/50">
        <CardTitle className="text-red-700 dark:text-red-400">
          Delete account
        </CardTitle>
        <p className="mt-2 text-sm text-deca-navy/60 dark:text-white/60">
          Permanently remove your account, application data, and reports. This
          cannot be undone.
          {isAdmin && " Admin accounts cannot be self-deleted from this page."}
        </p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => setDeleteOpen(true)}
          disabled={isAdmin}
        >
          <Trash2 className="h-4 w-4" />
          Delete my account
        </Button>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteAccount}
        title="Delete your account?"
        description="All of your data will be permanently removed. You will be signed out immediately."
        confirmLabel="Delete account"
        loading={deleting}
      />
    </div>
  );
}
