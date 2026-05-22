"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { officerPhotoPublicUrl } from "@/lib/officer-photo";
import { useIsAdmin } from "@/hooks/use-is-admin";
import type { Officer } from "@/types/database";
import { ImagePlus, Plus, Trash2, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface OfficersPanelProps {
  initialOfficers: Officer[];
  isAdmin: boolean;
}

export function OfficersPanel({
  initialOfficers,
  isAdmin: isAdminProp,
}: OfficersPanelProps) {
  const isAdmin = useIsAdmin(isAdminProp);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [officers, setOfficers] = useState(initialOfficers);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setName("");
    setTitle("");
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (picked.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const addOfficer = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!file) {
      toast.error("Please upload a photo");
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("title", title.trim());
    formData.set("file", file);

    const res = await fetch("/api/admin/officers", {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      toast.error(json.error ?? "Failed to add officer");
      if (res.status === 403) {
        toast.error("Your account is not admin. Sign out and back in after your role is set.");
      }
      return;
    }

    setOfficers((prev) => [...prev, json.officer as Officer]);
    setModalOpen(false);
    resetForm();
    toast.success("Officer added");
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/officers/${deleteId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    setDeleting(false);
    setDeleteId(null);

    if (!res.ok) {
      toast.error(json.error ?? "Failed to remove officer");
      return;
    }

    setOfficers((prev) => prev.filter((o) => o.id !== deleteId));
    toast.success("Officer removed");
    router.refresh();
  };

  return (
    <>
      {isAdmin && (
        <div className="mb-8 flex justify-end">
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add officer
          </Button>
        </div>
      )}

      {officers.length === 0 ? (
        <Card className="text-center">
          <User className="mx-auto mb-3 h-10 w-10 text-deca-navy/30 dark:text-white/30" />
          <p className="text-sm text-deca-navy/60 dark:text-white/60">
            Officer photos will appear here once your chapter admins add them.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {officers.map((officer) => {
            const photoUrl = officerPhotoPublicUrl(officer.image_path);
            return (
              <Card key={officer.id} className="overflow-hidden p-0">
                <div className="relative aspect-[4/5] bg-deca-navy/5 dark:bg-white/5">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={officer.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <User className="h-16 w-16 text-deca-navy/20" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-deca-navy dark:text-white">
                    {officer.name}
                  </p>
                  {officer.title && (
                    <p className="text-sm text-deca-gold-muted dark:text-deca-gold-light">
                      {officer.title}
                    </p>
                  )}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => setDeleteId(officer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title="Add officer"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
          <Input
            label="Role (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. President"
          />
          <div>
            <p className="mb-2 text-sm font-medium text-deca-navy dark:text-white/90">
              Photo
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-deca-navy/15 py-10 transition-colors hover:border-deca-gold dark:border-white/20"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Preview"
                  className="h-32 w-32 rounded-lg object-cover"
                />
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 text-deca-navy/40" />
                  <span className="text-sm text-deca-navy/50">
                    Upload image (max 5MB)
                  </span>
                </>
              )}
            </button>
          </div>
          <Button
            className="w-full"
            onClick={addOfficer}
            loading={saving}
            disabled={!name.trim() || !file}
          >
            Save officer
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Remove officer?"
        description="This will delete the officer and their photo from the team page."
        loading={deleting}
      />
    </>
  );
}
