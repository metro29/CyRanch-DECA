"use client";

import { createClient } from "@/lib/supabase/client";
import { parseAnswers, isApplicationLocked } from "@/lib/applications";
import { debounce } from "@/lib/utils";
import type {
  Application,
  ApplicationFormData,
  ApplicationStatus,
} from "@/types/database";
import { EMPTY_APPLICATION } from "@/types/database";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 3000;

export function useApplicationForm(
  initial: Application | null,
  userId: string,
  grade: string | null,
  onGradeChange?: (grade: string) => void
) {
  const supabase = createClient();
  const [form, setForm] = useState<ApplicationFormData>(
    initial ? parseAnswers(initial.answers) : { ...EMPTY_APPLICATION }
  );
  const [applicationId, setApplicationId] = useState<string | null>(
    initial?.id ?? null
  );
  const [status, setStatus] = useState<ApplicationStatus>(
    initial?.status ?? "draft"
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [resumeUrl, setResumeUrl] = useState<string | null>(
    initial?.resume_url ?? null
  );
  const [uploadProgress, setUploadProgress] = useState(0);

  const isLocked = isApplicationLocked(status);

  const saveDraft = useCallback(
    async (data: ApplicationFormData, silent = false) => {
      if (isLocked) return;
      setSaveStatus("saving");

      const payload = {
        user_id: userId,
        status: "draft" as const,
        answers: data,
        resume_url: resumeUrl,
      };

      try {
        if (applicationId) {
          const { error } = await supabase
            .from("applications")
            .update(payload)
            .eq("id", applicationId)
            .eq("status", "draft");

          if (error) throw error;
        } else {
          const { data: created, error } = await supabase
            .from("applications")
            .insert(payload)
            .select("id")
            .single();

          if (error) throw error;
          if (created) setApplicationId(created.id);
        }

        setSaveStatus("saved");
        if (!silent) toast.success("Draft saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (err) {
        setSaveStatus("error");
        const msg = err instanceof Error ? err.message : "Failed to save draft";
        if (!silent) toast.error(msg);
      }
    },
    [applicationId, isLocked, resumeUrl, supabase, userId]
  );

  const debouncedSave = useRef(
    debounce((data: ApplicationFormData) => {
      saveDraft(data, true);
    }, AUTOSAVE_MS)
  ).current;

  const updateField = (field: keyof ApplicationFormData, value: string) => {
    if (isLocked) return;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      debouncedSave(next);
      return next;
    });
  };

  const updateGrade = async (newGrade: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ grade: newGrade })
      .eq("id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    onGradeChange?.(newGrade);
  };

  useEffect(() => {
    if (!isLocked && applicationId) {
      const interval = setInterval(() => {
        saveDraft(form, true);
      }, AUTOSAVE_MS);
      return () => clearInterval(interval);
    }
  }, [applicationId, form, isLocked, saveDraft]);

  const uploadResume = async (file: File) => {
    if (isLocked) return { error: "Application is locked." };
    if (file.type !== "application/pdf") {
      return { error: "Only PDF files are allowed." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: "PDF must be under 5MB." };
    }

    setUploadProgress(10);
    const path = `${userId}/resume-${Date.now()}.pdf`;

    setUploadProgress(40);
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setUploadProgress(0);
      return { error: uploadError.message };
    }

    setUploadProgress(80);
    setResumeUrl(path);

    if (applicationId) {
      await supabase
        .from("applications")
        .update({ resume_url: path })
        .eq("id", applicationId)
        .eq("status", "draft");
    } else {
      await saveDraft(form, true);
    }

    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 800);
    toast.success("Resume uploaded");
    return { error: null };
  };

  const submitApplication = async () => {
    const required = Object.values(form).every((v) => v.trim().length >= 20);
    if (!required) {
      return {
        error: "Complete all sections with at least 20 characters each.",
      };
    }
    if (!grade?.trim()) {
      return { error: "Please select your grade." };
    }

    const payload = {
      user_id: userId,
      status: "submitted" as const,
      answers: form,
      resume_url: resumeUrl,
      submitted_at: new Date().toISOString(),
    };

    try {
      if (applicationId) {
        const { error } = await supabase
          .from("applications")
          .update(payload)
          .eq("id", applicationId)
          .eq("status", "draft");

        if (error) throw error;
      } else {
        const { error } = await supabase.from("applications").insert(payload);
        if (error) {
          if (error.code === "23505") {
            return { error: "You have already submitted an application." };
          }
          throw error;
        }
      }
      setStatus("submitted");
      toast.success("Application submitted successfully");
      return { error: null };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Submission failed";
      toast.error(msg);
      return { error: msg };
    }
  };

  return {
    form,
    updateField,
    updateGrade,
    saveStatus,
    isLocked,
    status,
    applicationId,
    resumeUrl,
    uploadProgress,
    uploadResume,
    submitApplication,
    saveDraft: () => saveDraft(form, false),
  };
}
