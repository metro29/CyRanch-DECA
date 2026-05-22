"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin } from "@/hooks/use-is-admin";
import {
  SOCIAL_PLATFORMS,
  type ClubInfo,
  type ClubSocial,
} from "@/types/database";
import { ExternalLink, Globe, Plus, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function platformIcon(platform: string) {
  if (platform === "Website") return Globe;
  return Share2;
}

interface FollowUsPanelProps {
  initialSocials: ClubSocial[];
  initialInfo: ClubInfo;
  isAdmin: boolean;
}

export function FollowUsPanel({
  initialSocials,
  initialInfo,
  isAdmin: isAdminProp,
}: FollowUsPanelProps) {
  const isAdmin = useIsAdmin(isAdminProp);
  const router = useRouter();
  const [socials, setSocials] = useState(initialSocials);
  const [description, setDescription] = useState(initialInfo.description);
  const [platform, setPlatform] = useState<string>(SOCIAL_PLATFORMS[0]);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const saveInfo = async () => {
    setSavingInfo(true);
    const res = await fetch("/api/admin/club-info", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: description.trim() }),
    });
    const json = await res.json();
    setSavingInfo(false);
    if (!res.ok) {
      toast.error(json.error ?? "Failed to save");
      return;
    }
    toast.success("Club info updated");
    router.refresh();
  };

  const addSocial = async () => {
    if (!url.trim()) {
      toast.error("URL is required");
      return;
    }
    setAdding(true);
    const res = await fetch("/api/admin/club-socials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        url: url.trim(),
        label: label.trim() || null,
      }),
    });
    const json = await res.json();
    setAdding(false);
    if (!res.ok) {
      toast.error(json.error ?? "Failed to add link");
      return;
    }
    setSocials((prev) => [...prev, json.social as ClubSocial]);
    setUrl("");
    setLabel("");
    toast.success("Link added");
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/club-socials/${deleteId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    setDeleting(false);
    setDeleteId(null);
    if (!res.ok) {
      toast.error(json.error ?? "Failed to remove link");
      return;
    }
    setSocials((prev) => prev.filter((s) => s.id !== deleteId));
    toast.success("Link removed");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardTitle>About our chapter</CardTitle>
        {isAdmin ? (
          <div className="mt-4 space-y-4">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Meeting times, room number, how to join..."
            />
            <Button onClick={saveInfo} loading={savingInfo}>
              Save club info
            </Button>
          </div>
        ) : (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-deca-navy/70 dark:text-white/70">
            {description || "Club information will be posted here soon."}
          </p>
        )}
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-deca-navy dark:text-white">
          Social links
        </h2>
        {socials.length === 0 ? (
          <Card>
            <p className="text-sm text-deca-navy/60 dark:text-white/60">
              No social links yet.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {socials.map((social) => {
              const Icon = platformIcon(social.platform);
              return (
                <Card key={social.id} className="flex items-center justify-between gap-3">
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-deca-navy/5 dark:bg-white/10">
                      <Icon className="h-5 w-5 text-deca-gold" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-deca-navy dark:text-white">
                        {social.label || social.platform}
                      </p>
                      <p className="truncate text-xs text-deca-navy/50 dark:text-white/50">
                        {social.url}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-deca-navy/40" />
                  </a>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-red-600"
                      onClick={() => setDeleteId(social.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {isAdmin && (
        <Card>
          <CardTitle>Add social link</CardTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-deca-navy dark:text-white/90">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-deca-navy/15 bg-white px-4 py-2.5 dark:border-white/15 dark:bg-deca-navy dark:text-white"
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Display label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="@deca_chapter"
            />
            <div className="sm:col-span-2">
              <Input
                label="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
          <Button className="mt-4" onClick={addSocial} loading={adding}>
            <Plus className="h-4 w-4" />
            Add link
          </Button>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Remove link?"
        description="This social link will be removed from the Follow Us page."
        loading={deleting}
      />
    </div>
  );
}
