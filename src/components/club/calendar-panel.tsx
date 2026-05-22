"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin } from "@/hooks/use-is-admin";
import type { CalendarEvent } from "@/types/database";
import { CalendarPlus, MapPin, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface CalendarPanelProps {
  initialEvents: CalendarEvent[];
  isAdmin: boolean;
  userId: string | null;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatEventRange(event: CalendarEvent) {
  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : null;
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  if (!end) return start.toLocaleString(undefined, opts);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${start.toLocaleString(undefined, opts)} – ${end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  }
  return `${start.toLocaleString(undefined, opts)} – ${end.toLocaleString(undefined, opts)}`;
}

export function CalendarPanel({
  initialEvents,
  isAdmin: isAdminProp,
  userId,
}: CalendarPanelProps) {
  const isAdmin = useIsAdmin(isAdminProp);
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = new Date(event.starts_at).toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return Array.from(map.entries());
  }, [events]);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setStartsAt("");
    setEndsAt("");
    setModalOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditing(event);
    setTitle(event.title);
    setDescription(event.description ?? "");
    setLocation(event.location ?? "");
    setStartsAt(toLocalInput(event.starts_at));
    setEndsAt(event.ends_at ? toLocalInput(event.ends_at) : "");
    setModalOpen(true);
  };

  const saveEvent = async () => {
    if (!title.trim() || !startsAt) {
      toast.error("Title and start date are required");
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      created_by: userId,
      updated_at: new Date().toISOString(),
    };

    const apiPayload = {
      title: payload.title,
      description: payload.description,
      location: payload.location,
      starts_at: payload.starts_at,
      ends_at: payload.ends_at,
    };

    if (editing) {
      const res = await fetch(`/api/admin/calendar-events/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });
      const json = await res.json();
      setSaving(false);
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update event");
        return;
      }
      setEvents((prev) =>
        prev
          .map((e) =>
            e.id === editing.id ? (json.event as CalendarEvent) : e
          )
          .sort(
            (a, b) =>
              new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
          )
      );
      toast.success("Event updated");
    } else {
      const res = await fetch("/api/admin/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });
      const json = await res.json();
      setSaving(false);
      if (!res.ok) {
        toast.error(json.error ?? "Failed to create event");
        return;
      }
      setEvents((prev) =>
        [...prev, json.event as CalendarEvent].sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        )
      );
      toast.success("Event added");
    }

    setModalOpen(false);
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/calendar-events/${deleteId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    setDeleting(false);
    setDeleteId(null);

    if (!res.ok) {
      toast.error(json.error ?? "Failed to delete event");
      return;
    }

    setEvents((prev) => prev.filter((e) => e.id !== deleteId));
    toast.success("Event deleted");
    router.refresh();
  };

  return (
    <>
      {isAdmin && (
        <div className="mb-8 flex justify-end">
          <Button onClick={openCreate}>
            <CalendarPlus className="h-4 w-4" />
            Add event
          </Button>
        </div>
      )}

      {events.length === 0 ? (
        <Card>
          <p className="text-sm text-deca-navy/60 dark:text-white/60">
            No events scheduled yet. Check back for chapter meetings and
            competition dates.
          </p>
        </Card>
      ) : (
        <div className="space-y-10">
          {grouped.map(([month, monthEvents]) => (
            <div key={month}>
              <h2 className="mb-4 text-lg font-semibold text-deca-navy dark:text-white">
                {month}
              </h2>
              <div className="space-y-4">
                {monthEvents.map((event) => (
                  <Card key={event.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        <p className="mt-1 text-sm text-deca-gold-muted dark:text-deca-gold-light">
                          {formatEventRange(event)}
                        </p>
                        {event.location && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-deca-navy/60 dark:text-white/60">
                            <MapPin className="h-4 w-4 shrink-0" />
                            {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p className="mt-3 text-sm text-deca-navy/70 dark:text-white/70">
                            {event.description}
                          </p>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(event)}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => setDeleteId(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit event" : "Add event"}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Start"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
          <Input
            label="End (optional)"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
          <Input
            label="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Textarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Button className="w-full" onClick={saveEvent} loading={saving}>
            {editing ? "Save changes" : "Add event"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete event?"
        description="This event will be removed from the calendar."
        loading={deleting}
      />
    </>
  );
}
