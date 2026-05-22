"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useApplicationForm } from "@/hooks/use-application-form";
import { validateStep } from "@/lib/applications";
import { cn } from "@/lib/utils";
import type { Application, ApplicationFormData } from "@/types/database";
import { GRADES } from "@/types/database";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

const STEPS = [
  { title: "Profile", description: "Grade level" },
  { title: "Leadership", description: "Experience & motivation" },
  { title: "Vision", description: "Goals & ideas" },
  { title: "Execution", description: "Plan, skills & resume" },
];

interface MultiStepFormProps {
  application: Application | null;
  userId: string;
  grade: string | null;
}

export function MultiStepForm({
  application,
  userId,
  grade: initialGrade,
}: MultiStepFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState(initialGrade ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    form,
    updateField,
    updateGrade,
    saveStatus,
    resumeUrl,
    uploadProgress,
    uploadResume,
    submitApplication,
  } = useApplicationForm(application, userId, grade, setGrade);

  const handleGrade = async (g: string) => {
    setGrade(g);
    await updateGrade(g);
  };

  const goNext = async () => {
    const err = validateStep(step, form, grade);
    if (err) {
      toast.error(err);
      return;
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { error } = await uploadResume(file);
    if (error) toast.error(error);
    setUploading(false);
  };

  const handleSubmit = async () => {
    const err = validateStep(3, form, grade);
    if (err) {
      toast.error(err);
      setStep(3);
      return;
    }
    setSubmitting(true);
    const { error } = await submitApplication();
    setSubmitting(false);
    if (error) return;
    router.push("/status");
    router.refresh();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-deca-navy sm:text-3xl">
            Officer Application
          </h1>
          <p className="mt-1 text-sm text-deca-navy/60">
            Auto-saves every few seconds · Step {step + 1} of {STEPS.length}
          </p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <nav aria-label="Progress" className="flex gap-2 sm:gap-4">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => i < step && setStep(i)}
            disabled={i > step}
            className={cn(
              "flex flex-1 flex-col items-center rounded-xl border px-2 py-3 text-center transition-all sm:px-4",
              i === step
                ? "border-deca-gold bg-deca-gold/10"
                : i < step
                  ? "border-emerald-200 bg-emerald-50 cursor-pointer"
                  : "border-deca-navy/10 bg-white opacity-60"
            )}
          >
            <span
              className={cn(
                "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                    ? "bg-deca-navy text-deca-gold"
                    : "bg-deca-navy/10 text-deca-navy/50"
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className="text-xs font-semibold text-deca-navy sm:text-sm">
              {s.title}
            </span>
            <span className="hidden text-xs text-deca-navy/50 sm:block">
              {s.description}
            </span>
          </button>
        ))}
      </nav>

      <Card className="min-h-[320px]">
        {step === 0 && (
          <StepProfile grade={grade} onGradeChange={handleGrade} />
        )}
        {step === 1 && (
          <StepFields
            fields={[
              {
                key: "leadership_experience",
                label: "Leadership Experience",
                hint: "Roles, projects, and measurable impact in DECA or elsewhere.",
              },
              {
                key: "motivation",
                label: "Motivation for DECA",
                hint: "Why you want to serve as a DECA officer.",
              },
            ]}
            form={form}
            updateField={updateField}
          />
        )}
        {step === 2 && (
          <StepFields
            fields={[
              {
                key: "officer_goals",
                label: "Officer Goals",
                hint: "What you hope to achieve in this role.",
              },
              {
                key: "ideas_for_year",
                label: "Ideas for the Year",
                hint: "Programs, events, and initiatives you'd bring.",
              },
            ]}
            form={form}
            updateField={updateField}
          />
        )}
        {step === 3 && (
          <div className="space-y-6">
            <StepFields
              fields={[
                {
                  key: "execution_plan",
                  label: "Execution Plan",
                  hint: "Timeline, resources, and how you'll measure success.",
                },
                {
                  key: "skills",
                  label: "Skills & Strengths",
                  hint: "Communication, organization, marketing, etc.",
                },
              ]}
              form={form}
              updateField={updateField}
            />
            <div className="border-t border-deca-navy/10 pt-6">
              <CardHeader>
                <CardTitle>Resume (Optional, PDF only)</CardTitle>
              </CardHeader>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleFile}
              />
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {resumeUrl ? "Replace PDF" : "Upload PDF"}
                </Button>
                {uploadProgress > 0 && (
                  <div className="h-2 overflow-hidden rounded-full bg-deca-navy/10">
                    <div
                      className="h-full bg-deca-gold transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                {resumeUrl && (
                  <p className="flex items-center gap-2 text-sm text-deca-navy/70">
                    <FileText className="h-4 w-4 text-deca-gold" />
                    Resume on file
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={goNext}>
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={submitting} size="lg">
            <CheckCircle2 className="h-5 w-5" />
            Submit Application
          </Button>
        )}
      </div>
    </div>
  );
}

function StepProfile({
  grade,
  onGradeChange,
}: {
  grade: string;
  onGradeChange: (g: string) => void;
}) {
  return (
    <div>
      <CardHeader>
        <CardTitle>Your grade level</CardTitle>
      </CardHeader>
      <p className="mb-4 text-sm text-deca-navy/60">
        Select your current grade. This helps the selection committee organize applicants.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onGradeChange(g)}
            className={cn(
              "rounded-xl border-2 py-4 text-center font-semibold transition-all",
              grade === g
                ? "border-deca-gold bg-deca-gold/10 text-deca-navy"
                : "border-deca-navy/10 hover:border-deca-gold/50"
            )}
          >
            Grade {g}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepFields({
  fields,
  form,
  updateField,
}: {
  fields: {
    key: keyof ApplicationFormData;
    label: string;
    hint: string;
  }[];
  form: ApplicationFormData;
  updateField: (key: keyof ApplicationFormData, value: string) => void;
}) {
  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={field.key}>
          <Textarea
            id={field.key}
            label={field.label}
            hint={field.hint}
            value={form[field.key]}
            onChange={(e) => updateField(field.key, e.target.value)}
            rows={5}
          />
          <p className="mt-1 text-right text-xs text-deca-navy/40">
            {form[field.key].length} characters (min. 20)
          </p>
        </div>
      ))}
    </div>
  );
}

function SaveIndicator({ status }: { status: string }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-deca-navy/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Saving...
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-emerald-600">
        <Cloud className="h-4 w-4" />
        Saved
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-red-600">
        <CloudOff className="h-4 w-4" />
        Save failed
      </span>
    );
  }
  return null;
}
