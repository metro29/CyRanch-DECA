import type {
  Application,
  ApplicationAnswers,
  ApplicationStatus,
  ApplicationWithScore,
  Score,
} from "@/types/database";
import { EMPTY_APPLICATION } from "@/types/database";

export function parseAnswers(raw: unknown): ApplicationAnswers {
  if (!raw || typeof raw !== "object") return { ...EMPTY_APPLICATION };
  const a = raw as Record<string, unknown>;
  return {
    leadership_experience: String(a.leadership_experience ?? ""),
    motivation: String(a.motivation ?? ""),
    officer_goals: String(a.officer_goals ?? ""),
    ideas_for_year: String(a.ideas_for_year ?? ""),
    execution_plan: String(a.execution_plan ?? ""),
    skills: String(a.skills ?? ""),
  };
}

export function isApplicationLocked(status: ApplicationStatus): boolean {
  return status !== "draft";
}

export function normalizeScore(
  scores: Score | Score[] | null | undefined
): Score | null {
  if (!scores) return null;
  return Array.isArray(scores) ? scores[0] ?? null : scores;
}

export function normalizeApplicationRow(
  row: Record<string, unknown>
): ApplicationWithScore {
  const answers = parseAnswers(row.answers);
  return {
    ...(row as unknown as Application),
    answers,
    scores: normalizeScore(row.scores as Score | Score[] | null),
    profiles: (row.profiles as ApplicationWithScore["profiles"]) ?? null,
  };
}

export function validateStep(
  step: number,
  answers: ApplicationAnswers,
  grade?: string | null
): string | null {
  const min = 20;
  switch (step) {
    case 0:
      if (!grade?.trim()) return "Please select your grade.";
      return null;
    case 1:
      if (answers.leadership_experience.trim().length < min)
        return `Leadership experience needs at least ${min} characters.`;
      if (answers.motivation.trim().length < min)
        return `Motivation needs at least ${min} characters.`;
      return null;
    case 2:
      if (answers.officer_goals.trim().length < min)
        return `Officer goals needs at least ${min} characters.`;
      if (answers.ideas_for_year.trim().length < min)
        return `Ideas for the year needs at least ${min} characters.`;
      return null;
    case 3:
      if (answers.execution_plan.trim().length < min)
        return `Execution plan needs at least ${min} characters.`;
      if (answers.skills.trim().length < min)
        return `Skills needs at least ${min} characters.`;
      return null;
    default:
      return null;
  }
}
