"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AppSettings } from "@/types/database";
import { Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ApplicationWindowControlProps {
  settings: AppSettings;
}

export function ApplicationWindowControl({
  settings: initial,
}: ApplicationWindowControlProps) {
  const [open, setOpen] = useState(initial.applications_open);
  const [loading, setLoading] = useState(false);

  const toggle = async (next: boolean) => {
    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applications_open: next }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Failed to update settings");
      return;
    }

    setOpen(next);
    toast.success(
      next
        ? "Applications are now OPEN — students can apply"
        : "Applications are now CLOSED"
    );
  };

  return (
    <Card
      className={
        open
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-deca-navy/15 bg-deca-cream/30"
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              open ? "bg-emerald-500 text-white" : "bg-deca-navy text-deca-gold"
            }`}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Calendar className="h-5 w-5" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-deca-navy">
              Application window
            </h2>
            <p className="mt-0.5 text-sm text-deca-navy/60">
              {open
                ? "Students can start or continue applications."
                : "Portal is closed — only admins and submitted status views."}
            </p>
            <p className="mt-1 text-xs text-deca-navy/40">
              Season: {initial.season_label}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {open ? (
            <Button
              variant="outline"
              onClick={() => toggle(false)}
              disabled={loading}
            >
              Close applications
            </Button>
          ) : (
            <Button onClick={() => toggle(true)} disabled={loading} loading={loading}>
              Open applications
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
